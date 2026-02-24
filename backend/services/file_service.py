"""File service — upload, list, download, delete SRT files."""

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO

from config import DATA_DIR


SUBTITLES_DIR = DATA_DIR / "subtitles"
TRANSLATED_DIR = DATA_DIR / "translated"


def _ensure_dirs() -> None:
    SUBTITLES_DIR.mkdir(parents=True, exist_ok=True)
    TRANSLATED_DIR.mkdir(parents=True, exist_ok=True)


def _file_info(path: Path) -> dict:
    stat = path.stat()
    return {
        "name": path.name,
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def save_uploaded_file(filename: str, content: bytes) -> dict:
    """Save an uploaded file to data/subtitles/ and return file info."""
    _ensure_dirs()
    dest = SUBTITLES_DIR / filename
    dest.write_bytes(content)
    return _file_info(dest)


def list_uploaded_files() -> list[dict]:
    """List all .srt files in data/subtitles/."""
    _ensure_dirs()
    files = sorted(SUBTITLES_DIR.glob("*.srt"), key=lambda p: p.name)
    return [_file_info(f) for f in files]


def get_translated_file_path(filename: str) -> Path | None:
    """Return the path to a translated file, or None if it doesn't exist."""
    _ensure_dirs()
    path = TRANSLATED_DIR / filename
    return path if path.exists() else None


def delete_file(filename: str) -> bool:
    """Delete a file from data/subtitles/. Returns True if deleted."""
    _ensure_dirs()
    path = SUBTITLES_DIR / filename
    if path.exists():
        path.unlink()
        return True
    return False


def list_translated_files() -> list[dict]:
    """List all .srt files in data/translated/."""
    _ensure_dirs()
    files = sorted(TRANSLATED_DIR.glob("*.srt"), key=lambda p: p.name)
    return [_file_info(f) for f in files]
