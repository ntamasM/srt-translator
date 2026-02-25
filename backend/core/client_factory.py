"""Factory for creating the correct translation client based on the AI platform."""

from typing import Any

# OpenAI-compatible endpoint base URLs
_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
_DEEPSEEK_BASE_URL = "https://api.deepseek.com"


def create_translation_client(
    ai_platform: str,
    api_key: str,
    model: str,
    temperature: float = 0.2,
    top_p: float = 0.1,
) -> Any:
    """Return a translation client that exposes ``translate_lines()``.

    Supported platforms:
    * ``openai``   – native OpenAI client
    * ``gemini``   – Google Cloud AI API via OpenAI-compatible endpoint
    * ``deepseek`` – DeepSeek via OpenAI-compatible endpoint
    * ``claude``   – Anthropic Claude via the ``anthropic`` SDK
    """
    platform = ai_platform.lower().strip()

    if platform in ("openai", "gemini", "deepseek"):
        from .openai_client import OpenAITranslationClient

        base_url_map = {
            "gemini": _GEMINI_BASE_URL,
            "deepseek": _DEEPSEEK_BASE_URL,
        }
        return OpenAITranslationClient(
            api_key=api_key,
            model=model,
            temperature=temperature,
            top_p=top_p,
            base_url=base_url_map.get(platform),
        )

    if platform == "claude":
        from .claude_client import ClaudeTranslationClient

        return ClaudeTranslationClient(
            api_key=api_key,
            model=model,
            temperature=temperature,
            top_p=top_p,
        )

    raise ValueError(
        f"Unsupported AI platform: '{ai_platform}'. "
        "Choose one of: openai, gemini, deepseek, claude."
    )
