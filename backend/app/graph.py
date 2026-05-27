import json
import logging
import re
import uuid
from datetime import UTC, datetime
from pathlib import Path

from .config import get_vault_path
from .deepseek_client import chat, parse_json_response

logger = logging.getLogger(__name__)

LEARNING_DIR = lambda: Path(get_vault_path()) / ".learning"
GRAPH_FILE = lambda: LEARNING_DIR() / "graph.json"


# ── File I/O ──────────────────────────────────────────────

def _ensure_dir() -> None:
    LEARNING_DIR().mkdir(parents=True, exist_ok=True)


def load_graph() -> dict:
    _ensure_dir()
    if not GRAPH_FILE().exists():
        return _initial_graph()
    f = GRAPH_FILE()
    return json.loads(f.read_text(encoding="utf-8"))


def save_graph(data: dict) -> None:
    _ensure_dir()
    GRAPH_FILE().write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _initial_graph() -> dict:
    return {
        "concepts": {},
        "edges": {},
        "extraction_status": {
            "phase": "idle",
            "total_notes_processed": 0,
            "total_notes": 0,
            "last_extraction": "",
        },
    }


# ── Concept CRUD ──────────────────────────────────────────

def upsert_concept(data: dict, concept: dict) -> str:
    """Insert or merge a concept. Returns the concept_id."""
    existing_id = _find_existing_concept(data, concept["name"])
    if existing_id:
        return _merge_concept(data, existing_id, concept)
    cid = _new_concept_id(data)
    concept.setdefault("id", cid)
    concept.setdefault("aliases", [])
    concept.setdefault("source_notes", [])
    concept.setdefault("mastery", 0.0)
    concept.setdefault("confidence", 0.0)
    concept.setdefault("total_attempts", 0)
    concept.setdefault("last_reviewed", "")
    concept.setdefault("next_review_due", "")
    concept.setdefault("weak_points", [])
    data["concepts"][cid] = concept
    return cid


def _new_concept_id(data: dict) -> str:
    while True:
        cid = "cn_" + uuid.uuid4().hex[:8]
        if cid not in data["concepts"]:
            return cid


def get_concept(data: dict, concept_id: str) -> dict | None:
    return data["concepts"].get(concept_id)


def list_concepts(data: dict) -> list[dict]:
    return list(data["concepts"].values())


def delete_orphaned(data: dict) -> int:
    """Remove concepts whose source_notes are empty. Returns count removed."""
    to_remove = [
        cid for cid, c in data["concepts"].items() if not c.get("source_notes")
    ]
    for cid in to_remove:
        del data["concepts"][cid]
        # also remove related edges
        data["edges"] = {
            eid: e
            for eid, e in data["edges"].items()
            if e["from"] != cid and e["to"] != cid
        }
    return len(to_remove)


# ── Edge CRUD ─────────────────────────────────────────────

def upsert_edge(data: dict, from_id: str, to_id: str, etype: str, weight: float, label: str) -> str:
    existing = next(
        (
            eid
            for eid, e in data["edges"].items()
            if e["from"] == from_id and e["to"] == to_id and e["type"] == etype
        ),
        None,
    )
    if existing:
        data["edges"][existing]["weight"] = weight
        data["edges"][existing]["label"] = label
        return existing
    eid = "e_" + uuid.uuid4().hex[:8]
    data["edges"][eid] = {
        "from": from_id,
        "to": to_id,
        "type": etype,
        "weight": weight,
        "label": label,
    }
    return eid


def get_edges_for_concept(data: dict, concept_id: str) -> dict:
    incoming = [
        {**e, "id": eid}
        for eid, e in data["edges"].items()
        if e["to"] == concept_id
    ]
    outgoing = [
        {**e, "id": eid}
        for eid, e in data["edges"].items()
        if e["from"] == concept_id
    ]
    return {"incoming": incoming, "outgoing": outgoing}


# ── Dedup ─────────────────────────────────────────────────

def _levenshtein_ratio(a: str, b: str) -> float:
    from difflib import SequenceMatcher
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _find_existing_concept(data: dict, name: str) -> str | None:
    """Check if a concept with this name (or a very similar one) already exists."""
    for cid, c in data["concepts"].items():
        existing = c["name"]
        # Name similarity check
        if _levenshtein_ratio(name, existing) >= 0.85:
            return cid
        # Alias check
        for alias in c.get("aliases", []):
            if _levenshtein_ratio(name, alias) >= 0.85:
                return cid
    return None


def _merge_concept(data: dict, cid: str, incoming: dict) -> str:
    existing = data["concepts"][cid]
    existing["source_notes"] = list(
        set(existing.get("source_notes", []) + incoming.get("source_notes", []))
    )
    for key in ("description", "section"):
        if incoming.get(key) and not existing.get(key):
            existing[key] = incoming[key]
    existing["aliases"] = list(
        set(existing.get("aliases", []) + incoming.get("aliases", []) + [incoming.get("name", "")]
    ))
    data["concepts"][cid] = existing
    return cid


# ── Extraction Status ─────────────────────────────────────

def set_extraction_status(data: dict, **kwargs) -> None:
    data["extraction_status"].update(kwargs)
    if kwargs.get("phase") == "completed":
        data["extraction_status"]["last_extraction"] = datetime.now(UTC).isoformat()


def get_extraction_status(data: dict) -> dict:
    return data["extraction_status"]


# ── Concept-level Mastery ─────────────────────────────────

def update_concept_mastery(
    data: dict, concept_id: str, session_score: float
) -> None:
    """Update mastery for a single concept using the Phase 2 weighted formula."""
    from .mastery import compute_mastery, interval_for_mastery

    concept = data["concepts"].get(concept_id)
    if not concept:
        return

    now = datetime.now(UTC)
    concept["total_attempts"] = concept.get("total_attempts", 0) + 1

    history: list[dict] = concept.get("_history_scores", [])
    aged = [{"score": h["score"], "days_ago": h["days_ago"] + 1} for h in history]
    aged.append({"score": session_score, "days_ago": 0})
    concept["_history_scores"] = aged[-20:]

    m = compute_mastery(aged, session_score)
    concept["mastery"] = m
    concept["confidence"] = min(1.0, concept["total_attempts"] / 10.0)
    concept["last_reviewed"] = now.isoformat()
    concept["next_review_due"] = (
        now + __import__("datetime").timedelta(days=interval_for_mastery(m))
    ).isoformat()

    data["concepts"][concept_id] = concept


# ── Extraction Pipeline ───────────────────────────────────

EXTRACTION_PROMPT = """你是一位知识图谱构建专家。分析以下笔记内容，提取其中的核心知识点。

对每个知识点输出：
- name: 知识点名称（简洁，5-15字）
- description: 一句话定义
- section: 在笔记中所属章节/段落标题（可选）
- prerequisites: 理解这个知识点需要哪些前置知识（概念名称列表）
- related: 与之相关的其他概念（概念名称列表，不同于前置依赖）

输出格式：严格的 JSON 数组
[{"name": "...", "description": "...", "section": "...", "prerequisites": [...], "related": [...]}]

规则：
- 每篇笔记提取 2-8 个知识点
- prerequisites 是你认为理解这个概念必须掌握的前置概念
- related 是与之相关但不构成前置依赖的概念
- 只输出 JSON，不要其他文字"""


async def extract_concepts_from_note(note_path: str, note_content: str) -> list[dict]:
    """Call Deepseek to extract concepts from a single note."""
    prompt = f"笔记路径: {note_path}\n\n笔记内容:\n{note_content[:8000]}"
    raw = await chat(EXTRACTION_PROMPT, prompt, temperature=0.3, timeout=60.0)
    try:
        return parse_json_response(raw) if isinstance(parse_json_response(raw), list) else []
    except Exception:
        # Try extracting array from response
        match = re.search(r"\[[\s\S]*\]", raw)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        logger.warning(f"Failed to parse concepts from note: {note_path}")
        return []


async def run_batch_extraction(note_paths: list[str] | None = None) -> None:
    """Run full extraction on all (or specified) vault notes."""
    from .vault import list_notes, read_note

    data = load_graph()
    status = data["extraction_status"]

    if status["phase"] == "running":
        return  # Already running

    if note_paths is None:
        all_notes = list_notes()
        note_paths = [n["path"] for n in all_notes]
    else:
        all_notes = list_notes()
        valid = {n["path"] for n in all_notes}
        note_paths = [p for p in note_paths if p in valid]

    status["phase"] = "running"
    status["total_notes"] = len(note_paths)
    status["total_notes_processed"] = 0
    save_graph(data)

    for i, path in enumerate(note_paths):
        try:
            note = read_note(path)
            concepts = await extract_concepts_from_note(path, note["plainText"])

            for c in concepts:
                c["source_notes"] = [f"{path}#{c.get('section', '')}"]
                cid = upsert_concept(data, c)

                for prereq_name in c.get("prerequisites", []):
                    prereq_id = _find_concept_by_name(data, prereq_name)
                    if prereq_id and prereq_id != cid:
                        upsert_edge(data, prereq_id, cid, "prerequisite_of", 0.8,
                                    f"{prereq_name} → {c['name']}")

                for related_name in c.get("related", []):
                    related_id = _find_concept_by_name(data, related_name)
                    if related_id and related_id != cid:
                        upsert_edge(data, cid, related_id, "related_to", 0.5,
                                    f"{c['name']} ↔ {related_name}")

            status["total_notes_processed"] = i + 1
        except Exception as e:
            logger.error(f"Extraction failed for {path}: {e}")
            status["total_notes_processed"] = i + 1

        # Save progress every 10 notes
        if (i + 1) % 10 == 0:
            save_graph(data)

    status["phase"] = "completed"
    status["last_extraction"] = datetime.now(UTC).isoformat()
    save_graph(data)


def _find_concept_by_name(data: dict, name: str) -> str | None:
    for cid, c in data["concepts"].items():
        if c["name"] == name or name in c.get("aliases", []):
            return cid
    # Fuzzy match
    for cid, c in data["concepts"].items():
        if _levenshtein_ratio(name, c["name"]) >= 0.85:
            return cid
    return None
