"""Translation service — wraps SRTTranslator with progress, cancellation, and parallel support."""

import asyncio
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any, Callable, Optional

from config import DATA_DIR
from core.translate import SRTTranslator

SUBTITLES_DIR = DATA_DIR / "subtitles"
TRANSLATED_DIR = DATA_DIR / "translated"

# Default number of parallel subtitle translations
DEFAULT_CONCURRENCY = 4

# In-memory job store
_jobs: dict[str, dict[str, Any]] = {}


class CancelledError(Exception):
    """Raised when a translation job is cancelled."""
    pass


def create_job(
    files: list[str],
    session_id: str = "",
    settings: dict[str, Any] | None = None,
    matching_words: list[dict[str, str]] | None = None,
    removal_words: list[str] | None = None,
) -> str:
    """Create a new translation job and return its ID."""
    job_id = uuid.uuid4().hex[:12]
    _jobs[job_id] = {
        "status": "pending",
        "files": files,
        "session_id": session_id,
        "settings": settings or {},
        "matching_words": matching_words or [],
        "removal_words": removal_words or [],
        "progress": {},
        "completed": [],
        "errors": {},
        "cancel_event": asyncio.Event(),  # set() to request cancellation
    }
    return job_id


def get_job(job_id: str) -> Optional[dict[str, Any]]:
    return _jobs.get(job_id)


def cancel_job(job_id: str) -> bool:
    """Request cancellation of a running job. Returns True if the job exists."""
    job = _jobs.get(job_id)
    if not job:
        return False
    job["cancel_event"].set()
    job["status"] = "cancelling"
    return True


def _write_temp_matching(words: list[dict[str, str]]) -> str | None:
    """Write matching words to a temp file in 'source --> target' format."""
    if not words:
        return None
    f = tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    )
    for w in words:
        f.write(f"{w['source']} --> {w['target']}\n")
    f.close()
    return f.name


def _write_temp_removal(words: list[str]) -> str | None:
    """Write removal words to a temp file, one per line."""
    if not words:
        return None
    f = tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    )
    for w in words:
        f.write(f"{w}\n")
    f.close()
    return f.name


async def run_translation(
    job_id: str,
    progress_callback: Optional[Callable] = None,
) -> None:
    """Run the translation for a job, calling progress_callback for updates."""
    job = _jobs.get(job_id)
    if not job:
        return

    cancel_event: asyncio.Event = job["cancel_event"]
    job["status"] = "running"
    config = job["settings"]
    session_id = job.get("session_id", "")

    # Session-scoped directories
    session_subs = SUBTITLES_DIR / session_id if session_id else SUBTITLES_DIR
    session_trans = TRANSLATED_DIR / session_id if session_id else TRANSLATED_DIR
    session_trans.mkdir(parents=True, exist_ok=True)

    # Write matching/removal words from client to temp files
    matching_file = _write_temp_matching(job["matching_words"])
    removal_file = _write_temp_removal(job["removal_words"])

    # API key from request settings; fall back to env
    api_key = config.get("api_key") or os.environ.get("OPENAI_API_KEY", "")

    translator = SRTTranslator(
        api_key=api_key,
        model=config.get("model", "gpt-4o-mini"),
        temperature=config.get("temperature", 0.2),
        top_p=config.get("top_p", 0.1),
        matching_file=matching_file,
        matching_case_insensitive=config.get("matching_case_insensitive", False),
        replace_credits=config.get("replace_credits", True),
        translator_name=config.get("translator_name", "Ntamas"),
        removal_file=removal_file,
    )

    src_lang = config.get("src_lang", "en")
    tgt_lang = config.get("tgt_lang", "el")
    add_credits = config.get("add_credits", True)
    append_credits_at_end = config.get("append_credits_at_end", False)

    for filename in job["files"]:
        if cancel_event.is_set():
            break

        input_path = session_subs / filename
        output_path = session_trans / filename

        if not input_path.exists():
            error_msg = f"File not found: {filename}"
            job["errors"][filename] = error_msg
            if progress_callback:
                await progress_callback({"type": "error", "file": filename, "message": error_msg})
            continue

        try:
            await _translate_file_parallel(
                translator, input_path, output_path,
                src_lang, tgt_lang, add_credits, append_credits_at_end,
                filename, job, progress_callback, cancel_event,
            )
            job["completed"].append(filename)
            if progress_callback:
                await progress_callback({"type": "file_complete", "file": filename, "output": filename})
        except CancelledError:
            if progress_callback:
                await progress_callback({"type": "cancelled", "file": filename, "message": "Translation cancelled"})
            break
        except Exception as e:
            error_msg = str(e)
            job["errors"][filename] = error_msg
            if progress_callback:
                await progress_callback({"type": "error", "file": filename, "message": error_msg})

    if cancel_event.is_set():
        job["status"] = "cancelled"
        if progress_callback:
            await progress_callback({"type": "cancelled", "message": "Translation cancelled by user"})
    else:
        job["status"] = "completed"
        if progress_callback:
            await progress_callback({"type": "all_complete", "files": job["completed"]})

    # Clean up temp files
    for path in (matching_file, removal_file):
        if path:
            try:
                os.unlink(path)
            except OSError:
                pass


async def _translate_file_parallel(
    translator: SRTTranslator,
    input_path: Path,
    output_path: Path,
    src_lang: str,
    tgt_lang: str,
    add_credits: bool,
    append_credits_at_end: bool,
    filename: str,
    job: dict,
    progress_callback: Optional[Callable],
    cancel_event: asyncio.Event,
) -> None:
    """Translate a single file using parallel subtitle processing with progress & cancel."""

    # Parse the SRT file
    subtitles = await asyncio.to_thread(
        translator.parse_srt_file, str(input_path)
    )
    total = len(subtitles)
    job["progress"][filename] = {"current": 0, "total": total}

    if progress_callback:
        await progress_callback({
            "type": "progress", "file": filename, "current": 0, "total": total,
        })

    # -- Parallel translation with semaphore for concurrency control --
    sem = asyncio.Semaphore(DEFAULT_CONCURRENCY)
    progress_lock = asyncio.Lock()
    current_done = {"value": 0}

    # Pre-allocate result list (preserve ordering)
    translated: list[Any] = [None] * total

    async def _translate_one(idx: int, sub):
        # Check cancellation before starting
        if cancel_event.is_set():
            raise CancelledError()

        async with sem:
            # Re-check after acquiring semaphore
            if cancel_event.is_set():
                raise CancelledError()

            result = await asyncio.to_thread(
                translator.translate_subtitle, sub, src_lang, tgt_lang
            )
            translated[idx] = result

            # Update progress
            async with progress_lock:
                current_done["value"] += 1
                current = current_done["value"]

            job["progress"][filename]["current"] = current
            if progress_callback:
                await progress_callback({
                    "type": "progress",
                    "file": filename,
                    "current": current,
                    "total": total,
                })

    # Launch all subtitle tasks
    tasks = [
        asyncio.create_task(_translate_one(i, sub))
        for i, sub in enumerate(subtitles)
    ]

    try:
        await asyncio.gather(*tasks)
    except CancelledError:
        # Cancel remaining tasks
        for t in tasks:
            t.cancel()
        # Wait for tasks to finish cancelling
        await asyncio.gather(*tasks, return_exceptions=True)
        raise

    # Finalize: add credits and write output
    await asyncio.to_thread(
        translator.finalize_subtitles,
        translated, str(output_path), add_credits, append_credits_at_end,
    )
