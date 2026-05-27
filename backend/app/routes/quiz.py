import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from ..config import MAX_CONTENT_LENGTH
from ..deepseek_client import chat, parse_json_response
from ..graph import get_edges_for_concept, load_graph
from ..prompts import EVAL_SYSTEM_PROMPT, QUIZ_SYSTEM_PROMPT
from ..resources import get_resource
from ..vault import read_note

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

# In-memory quiz storage (MVP: no database)
_quizzes: dict[str, dict] = {}


@router.post("/generate")
async def generate_quiz(req: dict):
    source_type = req.get("source_type", "vault")
    source_url = req.get("source_url", "")

    if source_type == "resource":
        resource = get_resource(req.get("resource_id", "")) if req.get("resource_id") else None
        content = (resource or {}).get("summary", "")
        if not content and source_url:
            from ..resources import fetch_article
            content = await fetch_article(source_url)
        if not content:
            raise HTTPException(status_code=400, detail="No resource content available")
        question_count = req.get("question_count", 5)
        user_message = f"文章内容：\n\n{content[:6000]}\n\n请生成 {question_count} 道题目的测验卷。"
        try:
            raw = await chat(QUIZ_SYSTEM_PROMPT, user_message)
            data = parse_json_response(raw)
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=502, detail=f"Failed to parse AI response: {e}")
        quiz_id = uuid.uuid4().hex[:12]
        quiz = {
            "quiz_id": quiz_id,
            "generated_at": datetime.now(UTC).isoformat(),
            "source_type": "resource",
            "source_url": source_url,
            "source_notes": [],
            "questions": data.get("questions", []),
        }
        _quizzes[quiz_id] = quiz
        return quiz

    note_paths: list[str] = req.get("note_paths", [])
    if not note_paths:
        raise HTTPException(status_code=400, detail="No notes selected")

    # Collect note contents
    parts: list[str] = []
    total_chars = 0
    for path in note_paths:
        try:
            note = read_note(path)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Note not found: {path}")
        parts.append(f"--- 笔记: {path} ---\n{note['plainText']}")
        total_chars += len(note["plainText"])

    # Token budget check
    if total_chars > MAX_CONTENT_LENGTH:
        raise HTTPException(
            status_code=413,
            detail="Selected notes are too large. Please select fewer notes or shorter content.",
        )

    combined = "\n\n".join(parts)
    question_count = req.get("question_count", min(15, max(3, total_chars // 500)))

    # Inject knowledge graph context
    graph_context = ""
    graph = load_graph()
    if graph["concepts"]:
        related_concept_ids: set[str] = set()
        for path in note_paths:
            for cid, c in graph["concepts"].items():
                for sn in c.get("source_notes", []):
                    if path in sn:
                        related_concept_ids.add(cid)
        if related_concept_ids:
            lines = ["\n已知知识点关系（可用于跨概念综合出题）："]
            for cid in list(related_concept_ids)[:20]:
                c = graph["concepts"][cid]
                edges = get_edges_for_concept(graph, cid)
                for e in edges.get("outgoing", [])[:5]:
                    lines.append(f"  {c['name']} → {e['label']}")
                for e in edges.get("incoming", [])[:5]:
                    lines.append(f"  {e['label']}")
            graph_context = "\n".join(lines)

    user_message = f"笔记内容：\n\n{combined}\n\n{graph_context}\n\n请生成 {question_count} 道题目的测验卷。"
    try:
        raw = await chat(QUIZ_SYSTEM_PROMPT, user_message)
        data = parse_json_response(raw)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse AI response: {e}")

    quiz_id = uuid.uuid4().hex[:12]
    quiz = {
        "quiz_id": quiz_id,
        "generated_at": datetime.now(UTC).isoformat(),
        "source_notes": note_paths,
        "questions": data.get("questions", []),
    }
    _quizzes[quiz_id] = quiz
    return quiz


@router.post("/evaluate")
async def evaluate_answer(req: dict):
    quiz_id = req.get("quiz_id", "")
    question_index = req.get("question_index", 0)
    user_answer = req.get("user_answer", "")

    quiz = _quizzes.get(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz["questions"]
    if question_index < 0 or question_index >= len(questions):
        raise HTTPException(status_code=400, detail="Invalid question index")

    question = questions[question_index]
    ref_concepts = question.get("reference_concepts", [])
    concept_info = ""
    if ref_concepts:
        graph = load_graph()
        concept_info = "关联知识点：\n"
        for cid in ref_concepts:
            c = graph["concepts"].get(cid, {})
            if c:
                concept_info += f"  - {c['name']} (id: {cid})\n"

    user_message = (
        f"题目类型：{question['type']}\n"
        f"题目：{question['stem']}\n"
        f"选项：{question.get('options', [])}\n"
        f"参考答案：{question.get('answer', '')}\n"
        f"解析：{question.get('explanation', '')}\n"
        f"出题来源笔记：{question.get('reference_notes', [])}\n"
        f"{concept_info}\n"
        f"学生答案：{user_answer}"
    )

    try:
        raw = await chat(EVAL_SYSTEM_PROMPT, user_message, temperature=0.3)
        result = parse_json_response(raw)
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Evaluation failed. Your answer has been saved. Please retry.",
                "user_answer": user_answer,
                "error": str(e),
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse AI response: {e}")

    return {
        "quiz_id": quiz_id,
        "question_index": question_index,
        **result,
    }
