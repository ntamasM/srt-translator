"""Pydantic models for translation endpoints."""

import re

from pydantic import BaseModel, Field, field_validator
from typing import Optional


class MatchingWordEntry(BaseModel):
    source: str = Field(..., min_length=1, max_length=200)
    target: str = Field(..., max_length=200)


class TranslationSettings(BaseModel):
    ai_platform: str = Field("openai", max_length=50)
    api_key: str = Field(..., min_length=1, max_length=256)
    model: str = Field("gpt-4o-mini", max_length=100, pattern=r"^[a-zA-Z0-9\-_\./:]+$")
    temperature: float = Field(0.2, ge=0, le=2)
    top_p: float = Field(0.1, ge=0, le=1)
    top_k: Optional[int] = Field(None, ge=0, le=1000)
    frequency_penalty: Optional[float] = Field(None, ge=-2, le=2)
    presence_penalty: Optional[float] = Field(None, ge=-2, le=2)
    src_lang: str = Field("en", max_length=10, pattern=r"^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$")
    tgt_lang: str = Field("el", max_length=10, pattern=r"^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$")
    translator_name: str = Field("AI", max_length=50)
    matching_case_insensitive: bool = False
    replace_credits: bool = True
    add_credits: bool = True
    append_credits_at_end: bool = False
    chunk_size: int = Field(24, ge=1, le=96)
    max_concurrency: int = Field(4, ge=1, le=10)
    max_chunk_retries: int = Field(2, ge=0, le=10)
    chunk_timeout_seconds: int = Field(240, ge=10, le=600)
    enable_quality_check: bool = True

    @field_validator("api_key")
    @classmethod
    def _strip_api_key(cls, v: str) -> str:
        return v.strip()


_FILENAME_BAD = re.compile(r"[\x00/\\]|\.{2,}")


class TranslationRequest(BaseModel):
    files: list[str] = Field(..., min_length=1, max_length=200)
    settings: TranslationSettings
    matching_words: list[MatchingWordEntry] = Field(default=[], max_length=1000)
    removal_words: list[str] = Field(default=[], max_length=1000)
    keywords: list[str] = Field(default=[], max_length=100)

    @field_validator("files")
    @classmethod
    def _validate_filenames(cls, v: list[str]) -> list[str]:
        for name in v:
            if len(name) > 255:
                raise ValueError(f"Filename too long: {name[:50]}...")
            if not name.lower().endswith(".srt"):
                raise ValueError(f"Only .srt files accepted: {name}")
            if _FILENAME_BAD.search(name):
                raise ValueError(f"Invalid filename: {name}")
        return v

    @field_validator("removal_words")
    @classmethod
    def _validate_removal(cls, v: list[str]) -> list[str]:
        for w in v:
            if len(w) > 200:
                raise ValueError("Removal word too long (max 200 chars)")
        return v

    @field_validator("keywords")
    @classmethod
    def _validate_keywords(cls, v: list[str]) -> list[str]:
        for w in v:
            if len(w) > 200:
                raise ValueError("Keyword too long (max 200 chars)")
        return v


class TranslationProgress(BaseModel):
    type: str  # "progress" | "file_complete" | "all_complete" | "error"
    file: Optional[str] = None
    current: Optional[int] = None
    total: Optional[int] = None
    message: Optional[str] = None
    files: Optional[list[str]] = None


class TranslationResult(BaseModel):
    job_id: str
    status: str  # "started" | "completed" | "error"
    message: Optional[str] = None
