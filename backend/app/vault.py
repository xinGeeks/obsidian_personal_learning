import re
from pathlib import Path
from typing import TypedDict

import yaml

from .config import get_vault_path

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
CODE_BLOCK_RE = re.compile(r"```[\s\S]*?```")
IMAGE_RE = re.compile(r"!\[.*?\]\(.*?\)")
WIKI_LINK_RE = re.compile(r"\[\[([^\]|#]+)(?:[#|][^\]]+)?\]\]")
TAG_RE = re.compile(r"(?:^|\s)#([a-zA-Z一-鿿][\w一-鿿/-]*)")


class NoteInfo(TypedDict):
    filename: str
    path: str
    title: str


class NoteContent(TypedDict):
    rawContent: str
    plainText: str
    frontmatter: dict
    tags: list[str]
    links: list[str]


def get_vault_dir() -> Path:
    path = Path(get_vault_path()).resolve()
    if not path.exists():
        raise FileNotFoundError(f"Vault directory not found: {path}")
    return path


def list_notes() -> list[NoteInfo]:
    vault = get_vault_dir()
    notes: list[NoteInfo] = []
    for md_file in sorted(vault.rglob("*.md")):
        rel_path = md_file.relative_to(vault).as_posix()
        title = _extract_title(md_file.read_text(encoding="utf-8"))
        notes.append(
            {"filename": md_file.name, "path": rel_path, "title": title or md_file.stem}
        )
    return notes


def read_note(note_path: str) -> NoteContent:
    vault = get_vault_dir()
    full_path = vault / note_path
    if not full_path.exists():
        raise FileNotFoundError(f"Note not found: {note_path}")

    raw = full_path.read_text(encoding="utf-8")
    fm = _parse_frontmatter(raw)
    tags = _extract_tags(raw, fm)
    links = _extract_wiki_links(raw)
    plain = _to_plain_text(raw)

    return {
        "rawContent": raw,
        "plainText": plain,
        "frontmatter": fm,
        "tags": list(tags),
        "links": list(links),
    }


def _extract_title(content: str) -> str:
    match = re.match(r"^#\s+(.+)", content)
    return match.group(1).strip() if match else ""


def _parse_frontmatter(content: str) -> dict:
    match = FRONTMATTER_RE.match(content)
    if not match:
        return {}
    try:
        return yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        return {}


def _extract_tags(content: str, frontmatter: dict) -> set[str]:
    tags: set[str] = set()
    fm_tags = frontmatter.get("tags", [])
    if isinstance(fm_tags, list):
        tags.update(t for t in fm_tags if isinstance(t, str))
    elif isinstance(fm_tags, str):
        tags.add(fm_tags)
    tags.update(TAG_RE.findall(content))
    return tags


def _extract_wiki_links(content: str) -> list[str]:
    return WIKI_LINK_RE.findall(content)


def _to_plain_text(content: str) -> str:
    content = FRONTMATTER_RE.sub("", content)
    content = CODE_BLOCK_RE.sub(" ", content)
    content = IMAGE_RE.sub(" ", content)
    content = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", content)
    content = re.sub(r"[#*>`|~]", " ", content)
    content = re.sub(r"\n{3,}", "\n\n", content)
    return content.strip()
