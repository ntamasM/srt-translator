"""File service — upload, list, download, delete SRT files (session-scoped)."""

import logging
import re
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import BinaryIO

from config import DATA_DIR

log = logging.getLogger(__name__)

MAX_AGE_DAYS = 7


SUBTITLES_DIR = DATA_DIR / "subtitles"
TRANSLATED_DIR = DATA_DIR / "translated"

_SESSION_RE = re.compile(r"^[a-f0-9]{32}$")


def _validate_session(session_id: str) -> str:
    """Validate session id to prevent path traversal."""
    if not _SESSION_RE.match(session_id):
        raise ValueError("Invalid session ID")
    return session_id


def _session_subtitles(session_id: str) -> Path:
    d = SUBTITLES_DIR / _validate_session(session_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _session_translated(session_id: str) -> Path:
    d = TRANSLATED_DIR / _validate_session(session_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _file_info(path: Path) -> dict:
    stat = path.stat()
    return {
        "name": path.name,
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def save_uploaded_file(session_id: str, filename: str, content: bytes) -> dict:
    """Save an uploaded file to data/subtitles/{session_id}/ and return file info."""
    dest = _session_subtitles(session_id) / filename
    dest.write_bytes(content)
    return _file_info(dest)


def list_uploaded_files(session_id: str) -> list[dict]:
    """List all .srt files in data/subtitles/{session_id}/."""
    d = _session_subtitles(session_id)
    files = sorted(d.glob("*.srt"), key=lambda p: p.name)
    return [_file_info(f) for f in files]


def get_translated_file_path(session_id: str, filename: str) -> Path | None:
    """Return the path to a translated file, or None if it doesn't exist."""
    path = _session_translated(session_id) / filename
    return path if path.exists() else None


def delete_file(session_id: str, filename: str) -> bool:
    """Delete a file from data/subtitles/{session_id}/. Returns True if deleted."""
    path = _session_subtitles(session_id) / filename
    if path.exists():
        path.unlink()
        return True
    return False


def list_translated_files(session_id: str) -> list[dict]:
    """List all .srt files in data/translated/{session_id}/."""
    d = _session_translated(session_id)
    files = sorted(d.glob("*.srt"), key=lambda p: p.name)
    return [_file_info(f) for f in files]


# ---------------------------------------------------------------------------
# Cleanup — delete files older than MAX_AGE_DAYS
# ---------------------------------------------------------------------------

def cleanup_old_files() -> int:
    """Delete files older than MAX_AGE_DAYS across all sessions.

    Also removes empty session directories. Returns the number of files deleted.
    """
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=MAX_AGE_DAYS)
    deleted = 0

    for base_dir in (SUBTITLES_DIR, TRANSLATED_DIR):
        if not base_dir.exists():
            continue
        for session_dir in base_dir.iterdir():
            if not session_dir.is_dir():
                continue
            for f in session_dir.iterdir():
                if not f.is_file():
                    continue
                mtime = datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc)
                if mtime < cutoff:
                    f.unlink()
                    deleted += 1
            # Remove session dir if empty
            try:
                session_dir.rmdir()
            except OSError:
                pass  # directory not empty, that's fine

    if deleted:
        log.info("Cleanup: deleted %d file(s) older than %d days", deleted, MAX_AGE_DAYS)
    return deleted
