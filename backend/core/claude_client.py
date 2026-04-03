"""Anthropic Claude client wrapper for structured SRT translation."""

import json
import logging
import random
import time
from typing import Callable, Dict, List, Optional, Any

import anthropic

log = logging.getLogger(__name__)


class ClaudeTranslationClient:
    """Client for translating text using Anthropic's Claude Messages API."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514",
                 temperature: float = 0.2, top_p: float = 0.1,
                 top_k: Optional[int] = None,
                 keywords: Optional[List[str]] = None):
        self.client = anthropic.Anthropic(api_key=api_key, timeout=60.0)
        self.model = model
        self.temperature = temperature
        self.top_p = top_p
        self.top_k = top_k
        self.keywords = keywords or []

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

    # ------------------------------------------------------------------
    # Public interface (same as OpenAITranslationClient)
    # ------------------------------------------------------------------

    def translate_lines(self, lines: List[str], src_lang: str, tgt_lang: str,
                        max_retries: int = 3,
                        cancel_check: Optional[Callable[[], bool]] = None) -> List[str]:
        if not lines or all(not line.strip() for line in lines):
            return lines

        # First attempt: batch
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

        # Second attempt: indexed
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

        # Fallback: line-by-line
        return self._translate_line_by_line(lines, src_lang, tgt_lang, max_retries, cancel_check)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _call(self, system: str, user: str,
              cancel_check: Optional[Callable[[], bool]] = None) -> str:
        """Make a Claude API call and return the text content."""
        delay = 1.0
        max_attempts = 3
        message = None

        for attempt in range(max_attempts):
            if cancel_check and cancel_check():
                raise InterruptedError("Translation cancelled")
            try:
                kwargs: Dict[str, Any] = dict(
                    model=self.model,
                    max_tokens=8192,
                    temperature=self.temperature,
                    top_p=self.top_p,
                    system=system,
                    messages=[{"role": "user", "content": user}],
                )
                if self.top_k is not None:
                    kwargs["top_k"] = self.top_k
                message = self.client.messages.create(**kwargs)
                break
            except Exception as e:
                msg = str(e).lower()
                retryable = any(
                    token in msg
                    for token in (
                        "timeout", "timed out", "rate limit", "429", "500", "502", "503", "504",
                        "temporarily", "overloaded", "connection", "network",
                    )
                )
                is_last = attempt == max_attempts - 1
                if is_last or not retryable:
                    raise
                if cancel_check and cancel_check():
                    raise InterruptedError("Translation cancelled")
                time.sleep(delay + random.uniform(0.0, 0.4))
                delay = min(delay * 2.0, 8.0)

        if message is None:
            raise ValueError("No response from Claude")

        # Claude returns a list of content blocks; take the first text block
        for block in message.content:
            if block.type == "text":
                return block.text
        raise ValueError("No text content in Claude response")

    def _parse_json_response(self, text: str) -> List[str]:
        """Extract the lines_translated array from a JSON response string."""
        # Claude may wrap JSON in markdown fences; strip them
        cleaned = text.strip()
        if cleaned.startswith("```"):
            # Remove opening fence (```json or ```)
            first_newline = cleaned.index("\n")
            cleaned = cleaned[first_newline + 1:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].rstrip()
        parsed = json.loads(cleaned)
        return parsed["lines_translated"]

    def _translate_batch(self, lines: List[str], src_lang: str, tgt_lang: str,
                        cancel_check: Optional[Callable[[], bool]] = None) -> List[str]:
        system = (
            f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
            f"{self._build_context_string()}"
            "CRITICAL: Return exactly the same number of lines as provided. "
            "Do not add, remove, merge, or split lines. "
            "Preserve all placeholders exactly as they appear. "
            "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}. "
            "If a line is empty or contains only whitespace, keep it empty. "
            "Respond with ONLY a JSON object — no extra text."
        )
        prompt = self._build_prompt(lines, src_lang, tgt_lang)
        content = self._call(system, prompt, cancel_check)
        return self._parse_json_response(content)

    def _translate_indexed(self, lines: List[str], src_lang: str, tgt_lang: str,
                          cancel_check: Optional[Callable[[], bool]] = None) -> List[str]:
        indexed_lines = [f"[{i+1}] {line}" for i, line in enumerate(lines)]
        system = (
            f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
            f"{self._build_context_string()}"
            "Each line is prefixed with [N]. Keep the [N] prefix but translate the content after it. "
            "CRITICAL: Return exactly the same number of lines as provided. "
            "Preserve all placeholders exactly as they appear. "
            "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}. "
            "Respond with ONLY a JSON object — no extra text."
        )
        prompt = self._build_prompt(indexed_lines, src_lang, tgt_lang)
        content = self._call(system, prompt, cancel_check)
        translated_indexed = self._parse_json_response(content)

        result = []
        for line in translated_indexed:
            bracket_end = line.find("] ")
            if bracket_end != -1:
                result.append(line[bracket_end + 2:])
            else:
                result.append(line)
        return result

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
                        time.sleep(1)
            else:
                # All retries exhausted for this line
                raise RuntimeError(
                    f"Failed to translate line after {max_retries} attempts: "
                    f"\"{line[:80]}\" — {last_error}"
                )
        return result

    def _translate_single_line(self, line: str, src_lang: str, tgt_lang: str,
                              cancel_check: Optional[Callable[[], bool]] = None) -> str:
        system = (
            f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
            f"{self._build_context_string()}"
            "Return exactly one translated line. "
            "Preserve all placeholders exactly as they appear. "
            "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}. "
            "Respond with ONLY a JSON object — no extra text."
        )
        prompt = self._build_prompt([line], src_lang, tgt_lang)
        content = self._call(system, prompt, cancel_check)
        translated_lines = self._parse_json_response(content)
        if len(translated_lines) != 1:
            raise ValueError(f"Expected 1 line, got {len(translated_lines)}")
        return translated_lines[0]

    @staticmethod
    def _build_prompt(lines: List[str], src_lang: str, tgt_lang: str) -> str:
        lines_json = json.dumps(lines, ensure_ascii=False)
        return f"""Translate these lines from {src_lang} to {tgt_lang}:

{lines_json}

IMPORTANT INSTRUCTIONS:
- Preserve all placeholders exactly as they appear
- DO NOT translate any text matching these patterns: MATCHINGTERM_{{}}, HTMLENTITY_{{}}, HTMLTAG_{{}}
- Only translate the actual text content, not placeholder patterns
- Keep all placeholder patterns completely unchanged

Return the translation as a JSON object with "lines_translated" array containing exactly {len(lines)} strings."""
