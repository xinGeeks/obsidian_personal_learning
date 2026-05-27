import uuid
from datetime import UTC, datetime

from fastapi import APIRouter

from ..graph import load_graph, save_graph, update_concept_mastery
from ..learning import get_summary, query_sessions, save_session
from ..mastery import update_mastery

router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.post("/sessions")
async def create_session(session: dict):
    session.setdefault("session_id", uuid.uuid4().hex[:12])
    session.setdefault("started_at", datetime.now(UTC).isoformat())
    result = save_session(session)
    # Trigger mastery update for each source note
    for note_path in session.get("source_notes", []):
        await update_mastery(note_path, session)
    # Trigger concept-level mastery update
    graph = load_graph()
    total_score = session.get("total_score", 0)
    if total_score is not None:
        for question in session.get("questions", []):
            for cid in question.get("question", {}).get("reference_concepts", []):
                update_concept_mastery(graph, cid, total_score)
        save_graph(graph)
    return result


@router.get("/history")
async def get_history(
    date_from: str | None = None,
    date_to: str | None = None,
    source_note: str | None = None,
):
    return query_sessions(date_from=date_from, date_to=date_to, source_note=source_note)


@router.get("/summary")
async def get_summary_route():
    return get_summary()
