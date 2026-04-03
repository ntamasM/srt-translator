"""File service — upload, list, download, delete SRT files (session-scoped)."""

import logging
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from config import settings

log = logging.getLogger(__name__)

SUBTITLES_DIR = settings.data_dir / "subtitles"
TRANSLATED_DIR = settings.data_dir / "translated"

_SESSION_RE = re.compile(r"^[a-f0-9]{32}$")
_FILENAME_BAD = re.compile(r"[\x00/\\]|\.{2,}")


def _validate_session(session_id: str) -> str:
    """Validate session id to prevent path traversal."""
    if not _SESSION_RE.match(session_id):
        raise ValueError("Invalid session ID")
    return session_id


def _sanitize_filename(filename: str) -> str:
    """Validate and sanitize a filename to prevent path traversal and injection."""
    if not filename or len(filename) > 255:
        raise ValueError("Invalid filename length")
    if _FILENAME_BAD.search(filename):
        raise ValueError(f"Invalid filename: {filename}")
    # Use only the basename (strip any directory components)
    name = Path(filename).name
    if not name:
        raise ValueError("Empty filename")
    return name


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
    safe_name = _sanitize_filename(filename)
    dest = _session_subtitles(session_id) / safe_name
    dest.write_bytes(content)
    return _file_info(dest)


def list_uploaded_files(session_id: str) -> list[dict]:
    """List all .srt files in data/subtitles/{session_id}/."""
    d = _session_subtitles(session_id)
    files = sorted(d.glob("*.srt"), key=lambda p: p.name)
    return [_file_info(f) for f in files]


def get_translated_file_path(session_id: str, filename: str) -> Path | None:
    """Return the path to a translated file, or None if it doesn't exist."""
    safe_name = _sanitize_filename(filename)
    path = _session_translated(session_id) / safe_name
    return path if path.exists() else None


def delete_file(session_id: str, filename: str) -> bool:
    """Delete a file from data/subtitles/{session_id}/. Returns True if deleted."""
    safe_name = _sanitize_filename(filename)
    path = _session_subtitles(session_id) / safe_name
    if path.exists():
        path.unlink()
        return True
    return False


def delete_translated_file(session_id: str, filename: str) -> bool:
    """Delete a file from data/translated/{session_id}/. Returns True if deleted."""
    safe_name = _sanitize_filename(filename)
    path = _session_translated(session_id) / safe_name
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
# Cleanup — delete files older than file_max_age_days
# ---------------------------------------------------------------------------

def cleanup_old_files() -> int:
    """Delete files older than the configured max age across all sessions.

    Also removes empty session directories. Returns the number of files deleted.
    """
    max_age_days = settings.file_max_age_days
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=max_age_days)
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
        log.info("Cleanup: deleted %d file(s) older than %d days", deleted, max_age_days)
    return deleted
