import asyncio
import json
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

from .config import get_vault_path
from .deepseek_client import chat, parse_json_response

LEARNING_DIR = lambda: Path(get_vault_path()) / ".learning"
MASTERY_FILE = lambda: LEARNING_DIR() / "mastery.json"


def _ensure_dir() -> None:
    LEARNING_DIR().mkdir(parents=True, exist_ok=True)


def _load_mastery() -> dict:
    _ensure_dir()
    if not MASTERY_FILE().exists():
        MASTERY_FILE().write_text('{"notes":{},"updated_at":""}\n', encoding="utf-8")
        return {"notes": {}, "updated_at": ""}
    f = MASTERY_FILE()
    return json.loads(f.read_text(encoding="utf-8"))


def _save_mastery(data: dict) -> None:
    _ensure_dir()
    data["updated_at"] = datetime.now(UTC).isoformat()
    MASTERY_FILE().write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def interval_for_mastery(m: float) -> int:
    if m < 0.3:
        return 1
    if m < 0.6:
        return 3
    if m < 0.8:
        return 7
    return 14


def compute_mastery(history_scores: list[dict], latest_score: float) -> float:
    if not history_scores:
        return latest_score
    total_weight = 0.0
    weighted_sum = 0.0
    for entry in history_scores:
        decay = 0.9 ** entry["days_ago"]
        weighted_sum += entry["score"] * decay
        total_weight += decay
    weighted_historical = weighted_sum / total_weight if total_weight > 0 else 0.0
    return round(0.7 * weighted_historical + 0.3 * latest_score, 4)


async def update_mastery(note_path: str, session: dict) -> dict | None:
    if session.get("total_score") is None:
        return None

    data = _load_mastery()
    now = datetime.now(UTC)
    latest_score = session["total_score"]
    source_notes = session.get("source_notes", [])

    updated_entries: dict[str, dict] = {}
    for note in source_notes:
        entry = data["notes"].get(note, {})
        attempts = entry.get("total_attempts", 0) + 1
        correct = entry.get("correct_attempts", 0) + (1 if latest_score >= 0.7 else 0)

        history_scores: list[dict] = entry.get("_history_scores", [])
        aged = [{"score": h["score"], "days_ago": h["days_ago"] + 1} for h in history_scores]
        aged.append({"score": latest_score, "days_ago": 0})
        history_scores = aged[-20:]

        mastery = compute_mastery(history_scores, latest_score)
        interval = interval_for_mastery(mastery)

        entry.update({
            "mastery": mastery,
            "confidence": min(1.0, attempts / 10.0),
            "total_attempts": attempts,
            "correct_attempts": correct,
            "avg_score": round(
                (entry.get("avg_score", 0.0) * (attempts - 1) + latest_score) / attempts, 4
            ),
            "last_reviewed": now.isoformat(),
            "next_review_due": (now + timedelta(days=interval)).isoformat(),
            "_history_scores": history_scores,
        })
        entry.setdefault("weak_concepts", [])
        entry.setdefault("ai_assessed_at", "")

        data["notes"][note] = entry
        updated_entries[note] = entry

    _save_mastery(data)

    for note, entry in updated_entries.items():
        if _should_ai_assess(entry):
            asyncio.create_task(_do_ai_assessment(note, entry, data))

    return updated_entries.get(note_path)


def _should_ai_assess(entry: dict) -> bool:
    if entry.get("total_attempts", 0) < 5:
        return False
    ai_at = entry.get("ai_assessed_at", "")
    if not ai_at:
        return True
    try:
        last = datetime.fromisoformat(ai_at)
    except ValueError:
        return True
    return (datetime.now(UTC) - last).days > 7


async def _do_ai_assessment(note_path: str, entry: dict, data: dict) -> None:
    from .learning import _load_records

    sessions = _load_records()
    note_sessions = [s for s in sessions if note_path in s.get("source_notes", [])]

    history_text = ""
    for s in note_sessions[-10:]:
        for q in s.get("questions", []):
            ev = q.get("evaluation", {}) or {}
            history_text += (
                f"题: {q['question']['stem']}\n"
                f"答: {q.get('user_answer', '')}\n"
                f"得分: {ev.get('score', '?')}\n"
                f"诊断: {ev.get('diagnostic', {}).get('summary', '')}\n\n"
            )

    if not history_text:
        return

    prompt = (
        f"笔记「{note_path}」的答题记录：\n\n{history_text}\n"
        f"公式掌握度: {entry['mastery']}\n\n"
        "评估用户真实掌握程度，输出 JSON:\n"
        '{"mastery_adjustment": 0.5, "weak_concepts": ["概念"], "summary": "一句话总结"}'
    )

    try:
        raw = await chat(
            "你是一位学习评估专家，根据答题记录判断学生对笔记内容的真实掌握程度。",
            prompt,
            temperature=0.3,
            timeout=30.0,
        )
        result = parse_json_response(raw)
    except Exception:
        return

    entry["mastery"] = round(
        0.5 * entry["mastery"] + 0.5 * result.get("mastery_adjustment", entry["mastery"]), 4
    )
    entry["weak_concepts"] = result.get("weak_concepts", [])
    entry["ai_assessed_at"] = datetime.now(UTC).isoformat()
    entry["confidence"] = min(1.0, entry.get("confidence", 0.5) + 0.15)

    data["notes"][note_path] = entry
    _save_mastery(data)


def get_overview() -> dict:
    data = _load_mastery()
    notes_list: list[dict] = []
    total_m = 0.0
    count = 0

    for path, entry in data["notes"].items():
        m = entry.get("mastery", 0.0)
        notes_list.append({
            "note_path": path,
            "title": _note_title(path),
            "mastery": m,
            "confidence": entry.get("confidence", 0.0),
            "total_attempts": entry.get("total_attempts", 0),
            "last_reviewed": entry.get("last_reviewed", ""),
            "next_review_due": entry.get("next_review_due", ""),
            "weak_concepts": entry.get("weak_concepts", []),
        })
        total_m += m
        count += 1

    notes_list.sort(key=lambda n: n["mastery"])
    return {
        "notes": notes_list,
        "overall_mastery": round(total_m / count, 4) if count > 0 else 0.0,
    }


def get_recommendations() -> dict:
    data = _load_mastery()
    now = datetime.now(UTC)
    due: list[dict] = []

    for path, entry in data["notes"].items():
        due_str = entry.get("next_review_due", "")
        if not due_str:
            continue
        try:
            due_dt = datetime.fromisoformat(due_str)
        except ValueError:
            continue
        if due_dt > now:
            continue

        m = entry.get("mastery", 0.0)
        overdue_days = max(0, (now - due_dt).days)
        priority = round((1 - m) * (1 + overdue_days / 7), 4)

        due.append({
            "note_path": path,
            "title": _note_title(path),
            "mastery": m,
            "overdue_days": overdue_days,
            "priority": priority,
            "weak_concepts": entry.get("weak_concepts", []),
        })

    due.sort(key=lambda d: d["priority"], reverse=True)

    for item in due:
        item["reason"] = _generate_reason(item)

    if not due:
        return {"items": [], "message": "当前没有需要复习的内容"}

    return {"items": due}


def _note_title(path: str) -> str:
    try:
        from .vault import get_vault_dir
        full = get_vault_dir() / path
        raw = full.read_text(encoding="utf-8")
        m = re.match(r"^#\s+(.+)", raw)
        return m.group(1).strip() if m else Path(path).stem
    except Exception:
        return Path(path).stem


def _generate_reason(item: dict) -> str:
    m = item["mastery"]
    days = item["overdue_days"]
    weak = item.get("weak_concepts", [])

    if not weak:
        if m < 0.3:
            return "掌握度较低，建议尽快复习"
        if m < 0.6:
            return f"已 {days} 天未复习，需要巩固"
        return f"已 {days} 天未复习，建议温故知新"

    concepts = "、".join(weak[:3])
    if m < 0.3:
        return f"薄弱概念: {concepts}，需要重点复习"
    if m < 0.6:
        return f"已 {days} 天未复习，概念「{concepts}」掌握不牢"
    return f"概念「{concepts}」需要定期回顾"
