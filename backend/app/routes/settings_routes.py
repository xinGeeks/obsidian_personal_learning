from fastapi import APIRouter

from ..settings import get_settings, save_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def settings():
    s = get_settings()
    # Mask the API key for display
    key = s.get("deepseek_api_key", "")
    s["deepseek_api_key_display"] = key[:6] + "****" + key[-4:] if len(key) > 10 else "未配置"
    return s


@router.put("")
async def update_settings(req: dict):
    updates = {k: v for k, v in req.items() if k != "deepseek_api_key_display"}
    result = save_settings(updates)
    key = result.get("deepseek_api_key", "")
    result["deepseek_api_key_display"] = key[:6] + "****" + key[-4:] if len(key) > 10 else "未配置"
    return result
