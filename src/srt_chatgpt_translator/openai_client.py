"""OpenAI client wrapper for structured SRT translation."""

import json
import time
from typing import Dict, List, Optional, Any

import openai
from openai import OpenAI


class OpenAITranslationClient:
    """Client for translating text using OpenAI's Responses API with structured output."""
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", 
                 temperature: float = 0.2, top_p: float = 0.1):
        """Initialize the OpenAI client.
        
        Args:
            api_key: OpenAI API key
            model: Model to use for translation
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.temperature = temperature
        self.top_p = top_p
        
        # JSON schema for structured output
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
    
    def translate_lines(self, lines: List[str], src_lang: str, tgt_lang: str, 
                       max_retries: int = 3) -> List[str]:
        """Translate a list of text lines while preserving structure.
        
        Args:
            lines: List of text lines to translate
            src_lang: Source language code
            tgt_lang: Target language code
            max_retries: Maximum number of retry attempts
            
        Returns:
            List of translated lines (same length as input)
            
        Raises:
            Exception: If translation fails after all retries
        """
        if not lines or all(not line.strip() for line in lines):
            return lines
        
        # First attempt: translate all lines together
        try:
            result = self._translate_batch(lines, src_lang, tgt_lang)
            if len(result) == len(lines):
                return result
        except Exception as e:
            print(f"Batch translation failed: {e}")
        
        # Second attempt: translate with explicit indexing
        try:
            result = self._translate_indexed(lines, src_lang, tgt_lang)
            if len(result) == len(lines):
                return result
        except Exception as e:
            print(f"Indexed translation failed: {e}")
        
        # Fallback: translate line by line
        return self._translate_line_by_line(lines, src_lang, tgt_lang, max_retries)
    
    def _translate_batch(self, lines: List[str], src_lang: str, tgt_lang: str) -> List[str]:
        """Translate all lines in a single API call."""
        prompt = self._build_prompt(lines, src_lang, tgt_lang)
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
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
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "translation_response",
                    "schema": self.response_schema
                }
            }
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI")
        
        try:
            parsed = json.loads(content)
            return parsed["lines_translated"]
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Invalid JSON response: {e}")
    
    def _translate_indexed(self, lines: List[str], src_lang: str, tgt_lang: str) -> List[str]:
        """Translate with explicit line indexing to help the model maintain structure."""
        indexed_lines = [f"[{i+1}] {line}" for i, line in enumerate(lines)]
        prompt = self._build_prompt(indexed_lines, src_lang, tgt_lang)
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
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
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "translation_response",
                    "schema": self.response_schema
                }
            }
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
                               max_retries: int) -> List[str]:
        """Fallback: translate each line individually."""
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
                        result.append(line)  # Keep original on failure
                    else:
                        time.sleep(1)  # Wait before retry
        
        return result
    
    def _translate_single_line(self, line: str, src_lang: str, tgt_lang: str) -> str:
        """Translate a single line."""
        prompt = self._build_prompt([line], src_lang, tgt_lang)
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional translator. Translate from {src_lang} to {tgt_lang}. "
                        "Return exactly one translated line. "
                        "Preserve all placeholders exactly as they appear. "
                        "DO NOT translate any text matching these patterns: MATCHINGTERM_{}, HTMLENTITY_{}, HTMLTAG_{}."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature,
            top_p=self.top_p,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "translation_response",
                    "schema": self.response_schema
                }
            }
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