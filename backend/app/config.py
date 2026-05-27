import os
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
VAULT_PATH = os.getenv("VAULT_PATH", "")

DEEPSEEK_MODEL = "deepseek-chat"
MAX_CONTENT_LENGTH = 60_000

DOMAIN_WEIGHTS_DEFAULTS = {
    "wikipedia.org": 1.0,
    "arxiv.org": 0.95,
    "khanacademy.org": 0.9,
    "github.com": 0.85,
    "zhihu.com": 0.7,
    "jianshu.com": 0.7,
    "cnblogs.com": 0.7,
    "csdn.net": 0.65,
    "medium.com": 0.7,
    "towardsdatascience.com": 0.75,
}
DEFAULT_DOMAIN_WEIGHT = 0.5
SEARCH_INTERVAL = 3.0


# ── Runtime-overridable via settings page ──

def get_api_key() -> str:
    from .settings import get_effective_api_key
    return get_effective_api_key()


def get_base_url() -> str:
    from .settings import get_effective_base_url
    return get_effective_base_url()


def get_model() -> str:
    from .settings import get_effective_model
    return get_effective_model()


def get_vault_path() -> str:
    from .settings import get_effective_vault_path
    return get_effective_vault_path()


def get_domain_weights() -> dict:
    from .settings import get_effective_domain_weights
    return get_effective_domain_weights()


def get_search_interval() -> float:
    from .settings import get_effective_search_interval
    return get_effective_search_interval()
