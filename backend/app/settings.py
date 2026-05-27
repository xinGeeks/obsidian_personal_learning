import json
from pathlib import Path

from .config import (
    DEFAULT_DOMAIN_WEIGHT,
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
    DOMAIN_WEIGHTS_DEFAULTS,
    MAX_CONTENT_LENGTH,
    SEARCH_INTERVAL,
    VAULT_PATH,
)

SETTINGS_FILE = Path(__file__).resolve().parent.parent / "data" / "settings.json"

DEFAULTS = {
    "vault_path": VAULT_PATH,
    "deepseek_api_key": DEEPSEEK_API_KEY,
    "deepseek_base_url": DEEPSEEK_BASE_URL,
    "deepseek_model": DEEPSEEK_MODEL,
    "max_content_length": MAX_CONTENT_LENGTH,
    "domain_weights": DOMAIN_WEIGHTS_DEFAULTS,
    "default_domain_weight": DEFAULT_DOMAIN_WEIGHT,
    "search_interval": SEARCH_INTERVAL,
}


def _ensure_file() -> dict:
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not SETTINGS_FILE.exists():
        SETTINGS_FILE.write_text(json.dumps({}, ensure_ascii=False, indent=2), encoding="utf-8")
        return {}
    return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))


def get_settings() -> dict:
    saved = _ensure_file()
    return {**DEFAULTS, **saved}


def save_settings(updates: dict) -> dict:
    saved = _ensure_file()
    writable = {
        "vault_path", "deepseek_api_key", "deepseek_base_url",
        "deepseek_model", "max_content_length", "domain_weights",
        "default_domain_weight", "search_interval",
    }
    for k, v in updates.items():
        if k in writable:
            saved[k] = v
    SETTINGS_FILE.write_text(json.dumps(saved, ensure_ascii=False, indent=2), encoding="utf-8")
    return {**DEFAULTS, **saved}


def get_effective_vault_path() -> str:
    return get_settings()["vault_path"]

def get_effective_api_key() -> str:
    return get_settings()["deepseek_api_key"]

def get_effective_model() -> str:
    return get_settings()["deepseek_model"]

def get_effective_base_url() -> str:
    return get_settings()["deepseek_base_url"]

def get_effective_domain_weights() -> dict:
    return get_settings()["domain_weights"]

def get_effective_search_interval() -> float:
    return float(get_settings()["search_interval"])
