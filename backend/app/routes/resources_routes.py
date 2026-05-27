from fastapi import APIRouter, HTTPException

from ..resources import (
    get_recommendations,
    list_resources,
    process_resource,
    save_note_to_vault,
    search_external,
)

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.post("/search")
async def search(req: dict):
    concept_ids = req.get("concept_ids", [])
    query = req.get("query", "")
    try:
        results = await search_external(concept_ids=concept_ids, query=query)
        return {"results": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/process")
async def process(req: dict):
    url = req.get("url", "")
    concept_ids = req.get("concept_ids", [])
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        resource = await process_resource(url, concept_ids)
        return {"resource": resource}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to process resource: {e}")


@router.post("/save-note")
async def save_note(req: dict):
    resource_id = req.get("resource_id", "")
    if not resource_id:
        raise HTTPException(status_code=400, detail="resource_id is required")
    try:
        note_path = save_note_to_vault(resource_id)
        return {"note_path": note_path}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/list")
async def list():
    return {"resources": list_resources()}


@router.get("/recommendations")
async def recommendations():
    return {"items": get_recommendations()}
