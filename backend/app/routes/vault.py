from fastapi import APIRouter, HTTPException

from ..vault import list_notes, read_note

router = APIRouter(prefix="/api/vault", tags=["vault"])


@router.get("/notes")
async def get_notes():
    try:
        return list_notes()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/notes/{note_path:path}")
async def get_note(note_path: str):
    try:
        return read_note(note_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
