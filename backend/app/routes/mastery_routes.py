from fastapi import APIRouter

from ..graph import load_graph, list_concepts
from ..mastery import get_overview, get_recommendations

router = APIRouter(prefix="/api/mastery", tags=["mastery"])


@router.get("/overview")
async def overview():
    result = get_overview()
    graph = load_graph()
    concepts = list_concepts(graph)
    if concepts:
        sorted_by_mastery = sorted(concepts, key=lambda c: c.get("mastery", 0.0))
        result["concepts_summary"] = {
            "total_concepts": len(concepts),
            "lowest_mastery_concepts": [
                {"id": c["id"], "name": c["name"], "mastery": c.get("mastery", 0.0)}
                for c in sorted_by_mastery[:5]
            ],
        }
    else:
        result["concepts_summary"] = {"total_concepts": 0, "lowest_mastery_concepts": []}
    return result


@router.get("/recommendations")
async def recommendations():
    return get_recommendations()
