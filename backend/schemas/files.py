"""Pydantic models for file operations."""

from pydantic import BaseModel


class FileInfo(BaseModel):
    name: str
    size: int  # bytes
    modified: str  # ISO timestamp


class UploadResponse(BaseModel):
    files: list[FileInfo]
    message: str
