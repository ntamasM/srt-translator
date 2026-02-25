"""Anthropic Claude client wrapper for structured SRT translation."""

import json
import time
from typing import Dict, List, Optional, Any

import anthropic


class ClaudeTranslationClient:
    """Client for translating text using Anthropic's Claude Messages API."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514",
                 temperature: float = 0.2, top_p: float = 0.1):
        self.client = anthropic.Anthropic(api_key=api_key, timeout=60.0)
        self.model = model
        self.temperature = temperature
        self.top_p = top_p

    # ------------------------------------------------------------------
    # Public interface (same as OpenAITranslationClient)
    # ------------------------------------------------------------------

    def translate_lines(self, lines: List[str], src_lang: str, tgt_lang: str,
                        max_retries: int = 3) -> List[str]:
        if not lines or all(not line.strip() for line in lines):
            return lines

        # First attempt: batch
        try:
            result = self._translate_batch(lines, src_lang, tgt_lang)
            if len(result) == len(lines):
                return result
        except Exception as e:
            print(f"Batch translation failed: {e}")

        # Second attempt: indexed
        try:
            result = self._translate_indexed(lines, src_lang, tgt_lang)
            if len(result) == len(lines):
                return result
        except Exception as e:
            print(f"Indexed translation failed: {e}")

        # Fallback: line-by-line
        return self._translate_line_by_line(lines, src_lang, tgt_lang, max_retries)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _call(self, system: str, user: str) -> str:
        """Make a Claude API call and return the text content."""
        message = self.client.messages.create(
            model=self.model,
            max_tokens=8192,
            temperature=self.temperature,
            top_p=self.top_p,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
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

    def _translate_batch(self, lines: List[str], src_lang: str, tgt_lang: str) -> List[str]:
        system = (
            f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
            "CRITICAL: Return exactly the same number of lines as provided. "
            "Do not add, remove, merge, or split lines. "
            "Preserve all placeholders exactly as they appear. "
            "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}. "
            "If a line is empty or contains only whitespace, keep it empty. "
            "Respond with ONLY a JSON object — no extra text."
        )
        prompt = self._build_prompt(lines, src_lang, tgt_lang)
        content = self._call(system, prompt)
        return self._parse_json_response(content)

    def _translate_indexed(self, lines: List[str], src_lang: str, tgt_lang: str) -> List[str]:
        indexed_lines = [f"[{i+1}] {line}" for i, line in enumerate(lines)]
        system = (
            f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
            "Each line is prefixed with [N]. Keep the [N] prefix but translate the content after it. "
            "CRITICAL: Return exactly the same number of lines as provided. "
            "Preserve all placeholders exactly as they appear. "
            "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}. "
            "Respond with ONLY a JSON object — no extra text."
        )
        prompt = self._build_prompt(indexed_lines, src_lang, tgt_lang)
        content = self._call(system, prompt)
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
                                max_retries: int) -> List[str]:
        result = []
        for line in lines:
            if not line.strip():
                result.append(line)
                continue
            for attempt in range(max_retries):
                try:
                    translated = self._translate_single_line(line, src_lang, tgt_lang)
                    result.append(translated)
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        print(f"Failed to translate line after {max_retries} attempts: {line}")
                        result.append(line)
                    else:
                        time.sleep(1)
        return result

    def _translate_single_line(self, line: str, src_lang: str, tgt_lang: str) -> str:
        system = (
            f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
            "Return exactly one translated line. "
            "Preserve all placeholders exactly as they appear. "
            "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}. "
            "Respond with ONLY a JSON object — no extra text."
        )
        prompt = self._build_prompt([line], src_lang, tgt_lang)
        content = self._call(system, prompt)
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
