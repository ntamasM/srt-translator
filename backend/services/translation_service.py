"""Translation service — wraps SRTTranslator with progress, cancellation, and parallel support."""

import asyncio
import logging
import os
import tempfile
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

from config import settings
from core.translate import SRTTranslator

log = logging.getLogger(__name__)

SUBTITLES_DIR = settings.data_dir / "subtitles"
TRANSLATED_DIR = settings.data_dir / "translated"

# Default parallelism and chunking for subtitle translation
DEFAULT_CONCURRENCY = 4
DEFAULT_CHUNK_SIZE = 24
MAX_CHUNK_SIZE = 96
DEFAULT_CHUNK_RETRIES = 2
DEFAULT_CHUNK_TIMEOUT = 240

# Auto-cleanup completed jobs after this many seconds
_JOB_TTL_SECONDS = 3600


class CancelledError(Exception):
    """Raised when a translation job is cancelled."""
    pass


@dataclass
class TranslationJob:
    """Typed representation of a translation job."""
    status: str
    files: list[str]
    session_id: str
    settings: dict[str, Any]
    matching_words: list[dict[str, str]]
    removal_words: list[str]
    keywords: list[str]
    progress: dict[str, dict[str, int]] = field(default_factory=dict)
    completed: list[str] = field(default_factory=list)
    errors: dict[str, str] = field(default_factory=dict)
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)
    created_at: float = field(default_factory=time.monotonic)
    finished_at: Optional[float] = None


class JobStore:
    """Thread-safe in-memory job store with automatic cleanup of stale jobs."""

    def __init__(self) -> None:
        self._jobs: dict[str, TranslationJob] = {}

    def create(
        self,
        files: list[str],
        session_id: str = "",
        settings: dict[str, Any] | None = None,
        matching_words: list[dict[str, str]] | None = None,
        removal_words: list[str] | None = None,
        keywords: list[str] | None = None,
    ) -> str:
        self._cleanup_stale()
        job_id = uuid.uuid4().hex[:12]
        self._jobs[job_id] = TranslationJob(
            status="pending",
            files=files,
            session_id=session_id,
            settings=settings or {},
            matching_words=matching_words or [],
            removal_words=removal_words or [],
            keywords=keywords or [],
        )
        return job_id

    def get(self, job_id: str) -> Optional[TranslationJob]:
        return self._jobs.get(job_id)

    def cancel(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if not job:
            return False
        job.cancel_event.set()
        job.status = "cancelling"
        return True

    def _cleanup_stale(self) -> None:
        """Remove finished jobs older than _JOB_TTL_SECONDS."""
        now = time.monotonic()
        stale = [
            jid for jid, j in self._jobs.items()
            if j.finished_at is not None and (now - j.finished_at) > _JOB_TTL_SECONDS
        ]
        for jid in stale:
            del self._jobs[jid]
        if stale:
            log.info("Cleaned up %d stale job(s)", len(stale))


_store = JobStore()


# Public API — thin wrappers around the store
def create_job(
    files: list[str],
    session_id: str = "",
    settings: dict[str, Any] | None = None,
    matching_words: list[dict[str, str]] | None = None,
    removal_words: list[str] | None = None,
    keywords: list[str] | None = None,
) -> str:
    return _store.create(files, session_id, settings, matching_words, removal_words, keywords)


def get_job(job_id: str) -> Optional[TranslationJob]:
    return _store.get(job_id)


def cancel_job(job_id: str) -> bool:
    return _store.cancel(job_id)


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
    job = _store.get(job_id)
    if not job:
        return

    cancel_event = job.cancel_event
    job.status = "running"
    config = job.settings
    session_id = job.session_id

    # Session-scoped directories
    session_subs = SUBTITLES_DIR / session_id if session_id else SUBTITLES_DIR
    session_trans = TRANSLATED_DIR / session_id if session_id else TRANSLATED_DIR
    session_trans.mkdir(parents=True, exist_ok=True)

    # Write matching/removal words from client to temp files
    matching_file = _write_temp_matching(job.matching_words)
    removal_file = _write_temp_removal(job.removal_words)

    # API key from request settings only (no env fallback)
    api_key = config.get("api_key", "")

    if not api_key:
        job.status = "error"
        if progress_callback:
            await progress_callback({
                "type": "error",
                "message": "No API key provided. Please set your API key in Settings.",
            })
        return

    translator = SRTTranslator(
        api_key=api_key,
        model=config.get("model", "gpt-4o-mini"),
        temperature=config.get("temperature", 0.2),
        top_p=config.get("top_p", 0.1),
        top_k=config.get("top_k"),
        frequency_penalty=config.get("frequency_penalty"),
        presence_penalty=config.get("presence_penalty"),
        matching_file=matching_file,
        matching_case_insensitive=config.get("matching_case_insensitive", False),
        replace_credits=config.get("replace_credits", True),
        translator_name=config.get("translator_name") or "AI",
        removal_file=removal_file,
        ai_platform=config.get("ai_platform", "openai"),
        keywords=job.keywords,
    )

    src_lang = config.get("src_lang", "en")
    tgt_lang = config.get("tgt_lang", "el")
    add_credits = config.get("add_credits", True)
    append_credits_at_end = config.get("append_credits_at_end", False)

    for filename in job.files:
        if cancel_event.is_set():
            break

        input_path = session_subs / filename
        output_path = session_trans / filename

        if not input_path.exists():
            error_msg = f"File not found: {filename}"
            job.errors[filename] = error_msg
            if progress_callback:
                await progress_callback({"type": "error", "file": filename, "message": error_msg})
            continue

        try:
            await _translate_file_parallel(
                translator, input_path, output_path,
                src_lang, tgt_lang, add_credits, append_credits_at_end,
                filename, job, progress_callback, cancel_event,
            )
            job.completed.append(filename)
            if progress_callback:
                await progress_callback({"type": "file_complete", "file": filename, "output": filename})
        except CancelledError:
            if progress_callback:
                await progress_callback({"type": "cancelled", "file": filename, "message": "Translation cancelled"})
            break
        except RuntimeError as e:
            error_msg = str(e)
            job.errors[filename] = error_msg
            if progress_callback:
                await progress_callback({
                    "type": "error",
                    "file": filename,
                    "message": f"Translation failed — the AI could not translate some lines after multiple attempts. "
                               f"This usually means the API is overloaded or the model is struggling with the content. "
                               f"Details: {error_msg}",
                })
            cancel_event.set()
            break
        except Exception as e:
            error_msg = str(e)
            job.errors[filename] = error_msg
            if progress_callback:
                await progress_callback({"type": "error", "file": filename, "message": error_msg})

    if cancel_event.is_set():
        job.status = "cancelled" if job.status == "cancelling" else "error"
        if progress_callback:
            if job.status == "cancelled":
                await progress_callback({"type": "cancelled", "message": "Translation cancelled by user"})
            else:
                await progress_callback({
                    "type": "error",
                    "message": "Translation stopped — some lines could not be translated. "
                               "The output file would have mixed languages.",
                })
    else:
        job.status = "completed"
        if progress_callback:
            await progress_callback({"type": "all_complete", "files": job.completed})

    job.finished_at = time.monotonic()

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
    job: TranslationJob,
    progress_callback: Optional[Callable],
    cancel_event: asyncio.Event,
) -> None:
    """Translate a single file using chunked subtitle processing with progress & cancel."""

    # Parse the SRT file
    subtitles = await asyncio.to_thread(
        translator.parse_srt_file, str(input_path)
    )
    total = len(subtitles)
    job.progress[filename] = {"current": 0, "total": total}

    if progress_callback:
        await progress_callback({
            "type": "progress", "file": filename, "current": 0, "total": total,
        })

    chunk_size_raw = job.settings.get("chunk_size", DEFAULT_CHUNK_SIZE)
    chunk_size = max(1, min(MAX_CHUNK_SIZE, int(chunk_size_raw)))
    max_chunk_retries = max(0, int(job.settings.get("max_chunk_retries", DEFAULT_CHUNK_RETRIES)))
    enable_quality_check = bool(job.settings.get("enable_quality_check", True))
    chunk_timeout = int(job.settings.get("chunk_timeout_seconds", DEFAULT_CHUNK_TIMEOUT))

    chunks = [
        (start, subtitles[start: start + chunk_size])
        for start in range(0, total, chunk_size)
    ]

    configured_max_concurrency = job.settings.get("max_concurrency")
    if configured_max_concurrency is None:
        max_workers = max(1, min(DEFAULT_CONCURRENCY, len(chunks), max(1, total // 40 + 1)))
    else:
        max_workers = max(1, min(int(configured_max_concurrency), len(chunks)))

    sem = asyncio.Semaphore(max_workers)
    progress_lock = asyncio.Lock()
    current_done = {"value": 0}

    # Pre-allocate result list (preserve ordering)
    translated: list[Any] = [None] * total
    error_count = {"value": 0}

    def _is_transient_error(exc: Exception) -> bool:
        msg = str(exc).lower()
        transient_signals = (
            "timeout", "timed out", "rate limit", "429", "503", "overloaded",
            "temporarily", "connection", "network", "reset by peer",
        )
        return any(sig in msg for sig in transient_signals)

    def _cancel_check() -> bool:
        return cancel_event.is_set()

    async def _translate_chunk_with_retry(chunk_subs):
        delay = 1.0
        for attempt in range(max_chunk_retries + 1):
            if cancel_event.is_set():
                raise CancelledError()

            try:
                return await asyncio.wait_for(
                    asyncio.to_thread(
                        translator.translate_subtitles_batch,
                        chunk_subs,
                        src_lang,
                        tgt_lang,
                        enable_quality_check,
                        _cancel_check,
                    ),
                    timeout=chunk_timeout,
                )
            except InterruptedError:
                raise CancelledError()
            except Exception as e:
                is_last = attempt >= max_chunk_retries
                if is_last or not _is_transient_error(e):
                    raise
                await asyncio.sleep(delay)
                delay = min(delay * 2.0, 8.0)

    async def _translate_one(chunk_idx: int, start: int, chunk_subs):
        if cancel_event.is_set():
            raise CancelledError()

        async with sem:
            if cancel_event.is_set():
                raise CancelledError()

            try:
                chunk_result = await _translate_chunk_with_retry(chunk_subs)
            except CancelledError:
                raise
            except Exception as chunk_error:
                # Fallback: per-subtitle translation
                chunk_result = []
                for sub in chunk_subs:
                    if cancel_event.is_set():
                        raise CancelledError()
                    try:
                        single = await asyncio.wait_for(
                            asyncio.to_thread(
                                translator.translate_subtitles_batch,
                                [sub],
                                src_lang,
                                tgt_lang,
                                False,
                                _cancel_check,
                            ),
                            timeout=max(90, chunk_timeout // 2),
                        )
                        chunk_result.extend(single)
                    except (CancelledError, InterruptedError):
                        raise CancelledError()
                    except RuntimeError:
                        raise
                    except Exception as e:
                        import srt as _srt

                        chunk_result.append(
                            _srt.Subtitle(
                                index=sub.index,
                                start=sub.start,
                                end=sub.end,
                                content=sub.content,
                            )
                        )
                        async with progress_lock:
                            error_count["value"] += 1
                        if progress_callback:
                            await progress_callback({
                                "type": "subtitle_error",
                                "file": filename,
                                "subtitle": sub.index,
                                "message": f"{e}",
                            })

                if progress_callback:
                    await progress_callback({
                        "type": "warning",
                        "file": filename,
                        "message": (
                            f"Chunk {chunk_idx + 1}/{len(chunks)} failed ({chunk_error}); "
                            "used per-subtitle fallback"
                        ),
                    })

            if len(chunk_result) != len(chunk_subs):
                import srt as _srt

                repaired = []
                for sub in chunk_subs:
                    repaired.append(
                        _srt.Subtitle(
                            index=sub.index,
                            start=sub.start,
                            end=sub.end,
                            content=sub.content,
                        )
                    )
                chunk_result = repaired
                async with progress_lock:
                    error_count["value"] += len(chunk_subs)

            for i, result in enumerate(chunk_result):
                translated[start + i] = result

            # Update progress
            async with progress_lock:
                current_done["value"] += len(chunk_subs)
                current = current_done["value"]

            job.progress[filename]["current"] = current
            if progress_callback:
                await progress_callback({
                    "type": "progress",
                    "file": filename,
                    "current": current,
                    "total": total,
                })

    # Launch all chunk tasks
    tasks = [
        asyncio.create_task(_translate_one(i, start, chunk_subs))
        for i, (start, chunk_subs) in enumerate(chunks)
    ]

    try:
        await asyncio.gather(*tasks)
    except CancelledError:
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        raise
    except RuntimeError:
        cancel_event.set()
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        raise

    # Report if there were subtitle-level errors
    if error_count["value"] > 0 and progress_callback:
        await progress_callback({
            "type": "warning",
            "file": filename,
            "message": f"{error_count['value']}/{total} subtitles failed to translate (kept original text)",
        })

    # Finalize: add credits and write output
    await asyncio.to_thread(
        translator.finalize_subtitles,
        translated, str(output_path), add_credits, append_credits_at_end,
    )
