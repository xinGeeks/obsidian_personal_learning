import json
import re

from openai import AsyncOpenAI

from .config import get_api_key, get_base_url, get_model

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not configured")
    if _client is None:
        _client = AsyncOpenAI(api_key=api_key, base_url=get_base_url())
    return _client


async def chat(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.7,
    timeout: float = 60.0,
) -> str:
    client = get_client()
    resp = await client.chat.completions.create(
        model=get_model(),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=temperature,
        timeout=timeout,
    )
    return resp.choices[0].message.content or ""


def parse_json_response(raw: str) -> dict:
    """Extract and parse JSON from LLM response, tolerating markdown fences."""
    raw = raw.strip()
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError(f"No JSON object found in response: {raw[:200]}")
    return json.loads(match.group(0))
