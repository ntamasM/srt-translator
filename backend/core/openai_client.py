"""OpenAI client wrapper for structured SRT translation."""

import json
import logging
import random
import time
from typing import Callable, Dict, List, Optional, Any

import openai
from openai import OpenAI

log = logging.getLogger(__name__)


class OpenAITranslationClient:
    """Client for translating text using OpenAI's Chat Completions API with structured output.

    Also works with any OpenAI-compatible endpoint (e.g. Google Gemini) by
    passing a custom *base_url*.
    """
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini",
                 temperature: float = 0.2, top_p: float = 0.1,
                 top_k: Optional[int] = None,
                 frequency_penalty: Optional[float] = None,
                 presence_penalty: Optional[float] = None,
                 base_url: Optional[str] = None,
                 keywords: Optional[List[str]] = None):
        kwargs: Dict[str, Any] = {"api_key": api_key, "timeout": 60.0}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = OpenAI(**kwargs)
        self.model = model
        self.temperature = temperature
        self.top_p = top_p
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.keywords = keywords or []

        # Use simple json_object format for non-OpenAI providers (e.g. DeepSeek)
        # as they don't support json_schema structured outputs.
        self._use_json_schema = base_url is None

        # JSON schema for structured output (OpenAI only)
        self.response_schema = {
            "type": "object",
            "properties": {
                "lines_translated": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["lines_translated"],
            "additionalProperties": False
        }

    def _extra_params(self) -> Dict[str, Any]:
        """Return optional sampling params that are set."""
        params: Dict[str, Any] = {}
        if self.frequency_penalty is not None:
            params["frequency_penalty"] = self.frequency_penalty
        if self.presence_penalty is not None:
            params["presence_penalty"] = self.presence_penalty
        return params

    def _build_context_string(self) -> str:
        """Build a context string from keywords to inject into system prompts."""
        if not self.keywords:
            return ""
        title = self.keywords[0] if self.keywords else ""
        other = self.keywords[1:] if len(self.keywords) > 1 else []
        parts = f'You are translating subtitles for "{title}".'
        if other:
            parts += f" Content context: {', '.join(other)}."
        parts += " Use this context to produce natural, accurate translations that match the tone, genre, and terminology of this content. "
        return parts

    def _get_response_format(self) -> dict:
        """Return the appropriate response_format for the provider."""
        if self._use_json_schema:
            return {
                "type": "json_schema",
                "json_schema": {
                    "name": "translation_response",
                    "schema": self.response_schema
                }
            }
        return {"type": "json_object"}

    @staticmethod
    def _is_retryable_error(exc: Exception) -> bool:
        msg = str(exc).lower()
        retry_tokens = (
            "timeout", "timed out", "rate limit", "429", "500", "502", "503", "504",
            "temporarily", "overloaded", "connection", "network",
        )
        return any(token in msg for token in retry_tokens)

    def _create_completion_with_backoff(self, cancel_check: Optional[Callable[[], bool]] = None, **kwargs):
        delay = 1.0
        max_attempts = 3
        for attempt in range(max_attempts):
            if cancel_check and cancel_check():
                raise InterruptedError("Translation cancelled")
            try:
                return self.client.chat.completions.create(**kwargs)
            except Exception as e:
                is_last = attempt == max_attempts - 1
                if is_last or not self._is_retryable_error(e):
                    raise
                if cancel_check and cancel_check():
                    raise InterruptedError("Translation cancelled")
                # Add jitter to avoid synchronized retries under shared rate limits.
                time.sleep(delay + random.uniform(0.0, 0.4))
                delay = min(delay * 2.0, 8.0)
    
    def translate_lines(self, lines: List[str], src_lang: str, tgt_lang: str,
                       max_retries: int = 3,
                       cancel_check: Optional[Callable[[], bool]] = None) -> List[str]:
        """Translate a list of text lines while preserving structure.

        Args:
            lines: List of text lines to translate
            src_lang: Source language code
            tgt_lang: Target language code
            max_retries: Maximum number of retry attempts
            cancel_check: Optional callable that returns True when cancelled

        Returns:
            List of translated lines (same length as input)

        Raises:
            Exception: If translation fails after all retries
        """
        if not lines or all(not line.strip() for line in lines):
            return lines

        # First attempt: translate all lines together
        try:
            if cancel_check and cancel_check():
                raise InterruptedError("Translation cancelled")
            result = self._translate_batch(lines, src_lang, tgt_lang, cancel_check)
            if len(result) == len(lines):
                return result
        except InterruptedError:
            raise
        except Exception as e:
            log.warning("Batch translation failed: %s", e)

        # Second attempt: translate with explicit indexing
        try:
            if cancel_check and cancel_check():
                raise InterruptedError("Translation cancelled")
            result = self._translate_indexed(lines, src_lang, tgt_lang, cancel_check)
            if len(result) == len(lines):
                return result
        except InterruptedError:
            raise
        except Exception as e:
            log.warning("Indexed translation failed: %s", e)

        # Fallback: translate line by line
        return self._translate_line_by_line(lines, src_lang, tgt_lang, max_retries, cancel_check)
    
    def _translate_batch(self, lines: List[str], src_lang: str, tgt_lang: str,
                        cancel_check: Optional[Callable[[], bool]] = None) -> List[str]:
        """Translate all lines in a single API call."""
        prompt = self._build_prompt(lines, src_lang, tgt_lang)

        response = self._create_completion_with_backoff(
            cancel_check=cancel_check,
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
                        f"{self._build_context_string()}"
                        "CRITICAL: Return exactly the same number of lines as provided. "
                        "Do not add, remove, merge, or split lines. "
                        "Preserve all placeholders exactly as they appear. "
                        "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}. "
                        "If a line is empty or contains only whitespace, keep it empty."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature,
            top_p=self.top_p,
            response_format=self._get_response_format(),
            **self._extra_params(),
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI")

        try:
            parsed = json.loads(content)
            return parsed["lines_translated"]
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Invalid JSON response: {e}")

    def _translate_indexed(self, lines: List[str], src_lang: str, tgt_lang: str,
                          cancel_check: Optional[Callable[[], bool]] = None) -> List[str]:
        """Translate with explicit line indexing to help the model maintain structure."""
        indexed_lines = [f"[{i+1}] {line}" for i, line in enumerate(lines)]
        prompt = self._build_prompt(indexed_lines, src_lang, tgt_lang)

        response = self._create_completion_with_backoff(
            cancel_check=cancel_check,
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
                        f"{self._build_context_string()}"
                        "Each line is prefixed with [N]. Keep the [N] prefix but translate the content after it. "
                        "CRITICAL: Return exactly the same number of lines as provided. "
                        "Preserve all placeholders exactly as they appear. "
                        "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature,
            top_p=self.top_p,
            response_format=self._get_response_format(),
            **self._extra_params(),
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI")
        
        try:
            parsed = json.loads(content)
            translated_indexed = parsed["lines_translated"]
            
            # Remove the [N] prefixes
            result = []
            for line in translated_indexed:
                # Find the first "] " and take everything after it
                bracket_end = line.find("] ")
                if bracket_end != -1:
                    result.append(line[bracket_end + 2:])
                else:
                    result.append(line)
            
            return result
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Invalid JSON response: {e}")
    
    def _translate_line_by_line(self, lines: List[str], src_lang: str, tgt_lang: str,
                               max_retries: int,
                               cancel_check: Optional[Callable[[], bool]] = None) -> List[str]:
        """Fallback: translate each line individually.

        Raises RuntimeError if any line fails after all retries so the caller
        can abort the job instead of producing a mixed-language file.
        """
        result = []
        for line in lines:
            if cancel_check and cancel_check():
                raise InterruptedError("Translation cancelled")
            if not line.strip():
                result.append(line)
                continue

            last_error: Optional[Exception] = None
            for attempt in range(max_retries):
                if cancel_check and cancel_check():
                    raise InterruptedError("Translation cancelled")
                try:
                    translated = self._translate_single_line(line, src_lang, tgt_lang, cancel_check)
                    result.append(translated)
                    break
                except InterruptedError:
                    raise
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        time.sleep(1)  # Wait before retry
            else:
                # All retries exhausted for this line
                raise RuntimeError(
                    f"Failed to translate line after {max_retries} attempts: "
                    f"\"{line[:80]}\" — {last_error}"
                )

        return result
    
    def _translate_single_line(self, line: str, src_lang: str, tgt_lang: str,
                              cancel_check: Optional[Callable[[], bool]] = None) -> str:
        """Translate a single line."""
        prompt = self._build_prompt([line], src_lang, tgt_lang)

        response = self._create_completion_with_backoff(
            cancel_check=cancel_check,
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
                        f"{self._build_context_string()}"
                        "Return exactly one translated line. "
                        "Preserve all placeholders exactly as they appear. "
                        "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature,
            top_p=self.top_p,
            response_format=self._get_response_format(),
            **self._extra_params(),
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI")
        
        try:
            parsed = json.loads(content)
            translated_lines = parsed["lines_translated"]
            if len(translated_lines) != 1:
                raise ValueError(f"Expected 1 line, got {len(translated_lines)}")
            return translated_lines[0]
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Invalid JSON response: {e}")
    
    def _build_prompt(self, lines: List[str], src_lang: str, tgt_lang: str) -> str:
        """Build the translation prompt."""
        lines_json = json.dumps(lines, ensure_ascii=False)
        return f"""Translate these lines from {src_lang} to {tgt_lang}:

{lines_json}

IMPORTANT INSTRUCTIONS:
- Preserve all placeholders exactly as they appear
- DO NOT translate any text matching these patterns: MATCHINGTERM_{{}}, HTMLENTITY_{{}}, HTMLTAG_{{}}
- Only translate the actual text content, not placeholder patterns
- Keep all placeholder patterns completely unchanged

Return the translation as a JSON object with "lines_translated" array containing exactly {len(lines)} strings."""