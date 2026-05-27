import asyncio

from fastapi import APIRouter, HTTPException

from ..graph import (
    get_concept,
    get_edges_for_concept,
    get_extraction_status,
    list_concepts,
    load_graph,
    run_batch_extraction,
    save_graph,
)

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("/overview")
async def overview():
    data = load_graph()
    edges_list = [{**e, "id": eid} for eid, e in data["edges"].items()]
    return {
        "concepts": list_concepts(data),
        "edges": edges_list,
    }


@router.get("/extraction-status")
async def extraction_status():
    data = load_graph()
    return get_extraction_status(data)


@router.post("/trigger-extraction")
async def trigger_extraction():
    data = load_graph()
    status = data["extraction_status"]
    if status["phase"] == "running":
        raise HTTPException(status_code=409, detail="Extraction is already in progress")
    asyncio.create_task(run_batch_extraction())
    return {"message": "Extraction started", "phase": "running"}


@router.get("/concept/{concept_id}")
async def concept_detail(concept_id: str):
    data = load_graph()
    concept = get_concept(data, concept_id)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    edges = get_edges_for_concept(data, concept_id)
    related_concepts = []
    for e in edges.get("incoming", []) + edges.get("outgoing", []):
        other_id = e["to"] if e["from"] == concept_id else e["from"]
        other = get_concept(data, other_id)
        if other:
            related_concepts.append({
                "id": other_id,
                "name": other["name"],
                "relation_type": e["type"],
                "relation_label": e["label"],
            })
    return {**concept, "related_concepts": related_concepts}
