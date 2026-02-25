"""Pydantic models for translation endpoints."""

from pydantic import BaseModel
from typing import Optional


class MatchingWordEntry(BaseModel):
    source: str
    target: str


class TranslationSettings(BaseModel):
    ai_platform: str = "openai"
    api_key: str
    model: str = "gpt-4o-mini"
    temperature: float = 0.2
    top_p: float = 0.1
    src_lang: str = "en"
    tgt_lang: str = "el"
    translator_name: str = "AI"
    matching_case_insensitive: bool = False
    replace_credits: bool = True
    add_credits: bool = True
    append_credits_at_end: bool = False


class TranslationRequest(BaseModel):
    files: list[str]  # list of filenames in data/subtitles/
    settings: TranslationSettings
    matching_words: list[MatchingWordEntry] = []  # sent from client IndexedDB
    removal_words: list[str] = []  # sent from client IndexedDB


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
