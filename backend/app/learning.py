import json
from collections import Counter
from datetime import datetime
from pathlib import Path

from .config import get_vault_path

LEARNING_DIR = lambda: Path(get_vault_path()) / ".learning"
RECORDS_FILE = lambda: LEARNING_DIR() / "records.json"


def _ensure_dir() -> None:
    LEARNING_DIR().mkdir(parents=True, exist_ok=True)


def _load_records() -> list[dict]:
    _ensure_dir()
    f = RECORDS_FILE()
    if not f.exists():
        f.write_text('{"sessions":[]}\n', encoding="utf-8")
        return []
    data = json.loads(f.read_text(encoding="utf-8"))
    return data.get("sessions", [])


def _save_records(sessions: list[dict]) -> None:
    _ensure_dir()
    RECORDS_FILE().write_text(
        json.dumps({"sessions": sessions}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def save_session(session: dict) -> dict:
    sessions = _load_records()
    sessions.append(session)
    _save_records(sessions)
    return session


def query_sessions(
    date_from: str | None = None,
    date_to: str | None = None,
    source_note: str | None = None,
) -> list[dict]:
    sessions = _load_records()
    result = sessions

    if date_from:
        result = [s for s in result if s.get("started_at", "") >= date_from]
    if date_to:
        result = [s for s in result if s.get("started_at", "") <= date_to]
    if source_note:
        result = [
            s for s in result if source_note in s.get("source_notes", [])
        ]

    result.sort(key=lambda s: s.get("started_at", ""), reverse=True)
    return result


def get_summary() -> dict:
    sessions = _load_records()
    total = len(sessions)
    if total == 0:
        return {
            "total_sessions": 0,
            "average_score": 0.0,
            "total_questions_answered": 0,
            "top_blind_spots": [],
        }

    scores: list[float] = []
    total_q = 0
    all_blind_spots: list[str] = []

    for s in sessions:
        if s.get("total_score") is not None:
            scores.append(s["total_score"])
        for q in s.get("questions", []):
            total_q += 1
            for spot in (q.get("evaluation", {})
                         .get("diagnostic", {})
                         .get("blind_spots", [])):
                all_blind_spots.append(spot.get("concept", ""))

    avg = sum(scores) / len(scores) if scores else 0.0
    blind_counter = Counter(all_blind_spots)
    top_blind = [
        {"concept": c, "count": n}
        for c, n in blind_counter.most_common(10)
    ]

    return {
        "total_sessions": total,
        "average_score": round(avg, 2),
        "total_questions_answered": total_q,
        "top_blind_spots": top_blind,
    }
