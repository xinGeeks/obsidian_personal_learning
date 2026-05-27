import asyncio
import json
import logging
import re
import time
import uuid
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from .config import (
    DEFAULT_DOMAIN_WEIGHT,
    get_domain_weights,
    get_search_interval,
    get_vault_path,
)
from .deepseek_client import chat, parse_json_response

logger = logging.getLogger(__name__)

LEARNING_DIR = lambda: Path(get_vault_path()) / ".learning"
RESOURCES_FILE = lambda: LEARNING_DIR() / "resources.json"
RESOURCES_DIR = lambda: Path(get_vault_path()) / "学习笔记" / "外部资料"
_last_search_time = 0.0

# ── File I/O ──────────────────────────────────────────────

def _ensure_dir() -> None:
    LEARNING_DIR().mkdir(parents=True, exist_ok=True)


def _load_resources() -> dict:
    _ensure_dir()
    f = RESOURCES_FILE()
    if not f.exists():
        f.write_text('{"resources":[]}\n', encoding="utf-8")
        return {"resources": []}
    return json.loads(f.read_text(encoding="utf-8"))


def _save_resources(data: dict) -> None:
    _ensure_dir()
    RESOURCES_FILE().write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def list_resources() -> list[dict]:
    data = _load_resources()
    items = data["resources"]
    items.sort(key=lambda r: r.get("saved_at", ""), reverse=True)
    return items


def get_resource(resource_id: str) -> dict | None:
    data = _load_resources()
    for r in data["resources"]:
        if r["id"] == resource_id:
            return r
    return None


def save_resource(entry: dict) -> str:
    data = _load_resources()
    rid = entry.get("id") or "res_" + uuid.uuid4().hex[:8]
    entry["id"] = rid
    entry.setdefault("saved_at", datetime.now(UTC).isoformat())
    entry.setdefault("reviewed", False)
    entry.setdefault("saved_note_path", "")
    data["resources"].append(entry)
    _save_resources(data)
    return rid


# ── Search ────────────────────────────────────────────────

def _domain_weight(url: str) -> float:
    host = urlparse(url).hostname or ""
    for domain, w in get_domain_weights().items():
        if domain in host:
            return w
    return DEFAULT_DOMAIN_WEIGHT


def _rate_limit() -> None:
    global _last_search_time
    elapsed = time.time() - _last_search_time
    interval = get_search_interval()
    if elapsed < interval:
        time.sleep(interval - elapsed)
    _last_search_time = time.time()


async def search_external(concept_ids: list[str] | None = None, query: str = "") -> list[dict]:
    from .graph import get_concept, load_graph

    if not query and concept_ids:
        graph = load_graph()
        names = []
        for cid in concept_ids[:3]:
            c = get_concept(graph, cid)
            if c:
                names.append(c["name"])
        query = " ".join(names) + " 学习"

    if not query.strip():
        raise ValueError("Missing search terms")

    _rate_limit()

    try:
        from duckduckgo_search import DDGS
        loop = asyncio.get_running_loop()
        results = await loop.run_in_executor(
            None, lambda: list(DDGS().text(query, max_results=10))
        )
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return []

    scored = []
    for i, r in enumerate(results):
        url = r.get("href", "")
        w = _domain_weight(url)
        scored.append({
            "title": r.get("title", ""),
            "url": url,
            "snippet": r.get("body", ""),
            "source": urlparse(url).hostname or "unknown",
            "domain_weight": w,
            "score": round(w * (1 - i * 0.05), 4),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:5]


# ── Fetch ─────────────────────────────────────────────────

async def fetch_article(url: str) -> str:
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.get(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; LearningHub/1.0)",
        })
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        article = soup.find("article") or soup.find("main") or soup.find("body")
        text = article.get_text(separator="\n") if article else soup.get_text(separator="\n")
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        return text[:8000]


# ── AI Processing ─────────────────────────────────────────

SUMMARY_PROMPT = """你是学习助手，为文章生成中文摘要。
输出 JSON: {"summary": "300-500字摘要", "key_points": ["要点1", "要点2", ...]}
只输出 JSON。"""

QUIZ_PROMPT = """基于以下文章内容生成 3-5 道中文测验题（混合题型）。
输出 JSON: {"questions": [{type, stem, options?, answer, explanation}]}
只输出 JSON。"""

NOTE_PROMPT = """基于文章生成 Markdown 学习笔记，结构：
## 摘要
## 关键知识点
## 与现有知识的可能关联
## 原文链接
输出直接的 Markdown 文本，不要用 JSON 包裹。"""


async def process_resource(url: str, concept_ids: list[str] | None = None) -> dict:
    text = await fetch_article(url)
    title = url.split("/")[-1] or url

    async def do_summary():
        try:
            raw = await chat(SUMMARY_PROMPT, f"文章: {text[:5000]}\n生成摘要。", temperature=0.3, timeout=30.0)
            return parse_json_response(raw)
        except Exception:
            return {"summary": "摘要生成失败", "key_points": []}

    async def do_quiz():
        try:
            raw = await chat(QUIZ_PROMPT, f"文章: {text[:6000]}\n生成题目。", temperature=0.5, timeout=30.0)
            return parse_json_response(raw)
        except Exception:
            return {"questions": []}

    async def do_note():
        try:
            return await chat(NOTE_PROMPT, f"文章标题: {title}\n内容: {text[:6000]}\n原文链接: {url}", temperature=0.4, timeout=30.0)
        except Exception:
            return f"## 摘要\n\n{text[:300]}...\n\n## 原文链接\n\n{url}"

    summary_r, quiz_r, note_r = await asyncio.gather(do_summary(), do_quiz(), do_note())

    source = urlparse(url).hostname or "unknown"

    entry = {
        "url": url,
        "title": title,
        "source": source,
        "domain_weight": _domain_weight(url),
        "related_concepts": concept_ids or [],
        "summary": summary_r.get("summary", ""),
        "key_points": summary_r.get("key_points", []),
        "quiz_questions": quiz_r.get("questions", []),
        "note_markdown": note_r if isinstance(note_r, str) else str(note_r),
    }
    rid = save_resource(entry)
    entry["id"] = rid
    return entry


# ── Save Note to Vault ────────────────────────────────────

def save_note_to_vault(resource_id: str) -> str:
    resource = get_resource(resource_id)
    if not resource:
        raise FileNotFoundError(f"Resource {resource_id} not found")
    if resource.get("saved_note_path"):
        return resource["saved_note_path"]

    res_dir = RESOURCES_DIR()
    res_dir.mkdir(parents=True, exist_ok=True)
    safe_title = re.sub(r"[^\w\-\s]", "", resource["title"])[:40]
    fname = f"{safe_title}.md"
    fpath = res_dir / fname
    fpath.write_text(resource["note_markdown"], encoding="utf-8")

    data = _load_resources()
    for r in data["resources"]:
        if r["id"] == resource_id:
            r["saved_note_path"] = str(fpath.relative_to(Path(get_vault_path())).as_posix())
    _save_resources(data)

    return str(fpath.relative_to(Path(get_vault_path())).as_posix())


# ── Recommendations ───────────────────────────────────────

def get_recommendations() -> list[dict]:
    from .graph import list_concepts, load_graph

    resources_data = _load_resources()
    saved_urls = {r["url"] for r in resources_data["resources"]}
    graph = load_graph()

    weak = [c for c in list_concepts(graph) if c.get("mastery", 0) < 0.3]
    weak.sort(key=lambda c: c.get("mastery", 0))

    items = []
    for c in weak[:5]:
        for r in resources_data["resources"]:
            if c["id"] in r.get("related_concepts", []) and not r.get("reviewed"):
                items.append({
                    "concept_name": c["name"],
                    "concept_id": c["id"],
                    "resource": r,
                    "reason": f"你的「{c['name']}」掌握度较低({round(c.get('mastery',0)*100)}%)，推荐阅读此资料",
                })
                break

    return items[:3]
