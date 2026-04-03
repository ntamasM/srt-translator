"""Translation API endpoints + WebSocket for real-time progress."""

import asyncio
import json
import re
import time

from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from schemas.translation import TranslationRequest, TranslationResult
from config import settings
from dependencies import get_session_id
from middleware.rate_limit import limiter
from services import translation_service

router = APIRouter(tags=["translation"])

_JOB_ID_RE = re.compile(r"^[a-f0-9]{12}$")


@router.post("/api/translate", response_model=TranslationResult)
@limiter.limit(settings.translate_rate_limit)
def start_translation(
    req: TranslationRequest,
    request: Request,
    session_id: str = Depends(get_session_id),
):
    """Create a translation job and return a job_id.

    The actual work runs when a client connects to the WebSocket.
    """
    matching = [{"source": w.source, "target": w.target} for w in req.matching_words]
    settings_dict = req.settings.model_dump()
    job_id = translation_service.create_job(
        req.files,
        session_id=session_id,
        settings=settings_dict,
        matching_words=matching,
        removal_words=req.removal_words,
        keywords=req.keywords,
    )
    return TranslationResult(job_id=job_id, status="started", message="Connect to WebSocket to begin")


@router.post("/api/translate/{job_id}/cancel")
@limiter.limit(settings.general_rate_limit)
def cancel_translation(job_id: str, request: Request):
    """Cancel a running translation job."""
    if not _JOB_ID_RE.match(job_id):
        return {"status": "error", "message": "Invalid job ID"}
    found = translation_service.cancel_job(job_id)
    if not found:
        return {"status": "error", "message": f"Job {job_id} not found"}
    return {"status": "cancelling", "message": "Cancel requested"}


@router.websocket("/ws/translate/{job_id}")
async def translate_ws(ws: WebSocket, job_id: str):
    """WebSocket endpoint that streams translation progress."""
    # Validate job_id format
    if not _JOB_ID_RE.match(job_id):
        await ws.close(code=4001, reason="Invalid job ID")
        return

    # Validate origin against allowed origins
    origin = ws.headers.get("origin", "")
    allowed_origins = settings.resolved_cors_origins
    if origin and allowed_origins and origin not in allowed_origins:
        await ws.close(code=4003, reason="Origin not allowed")
        return

    await ws.accept()

    job = translation_service.get_job(job_id)
    if not job:
        await ws.send_json({"type": "error", "message": f"Job {job_id} not found"})
        await ws.close()
        return

    # Validate session: the connecting client must own this job
    ws_session_id = ws.cookies.get("session_id", "")
    if ws_session_id and job.session_id and ws_session_id != job.session_id:
        await ws.send_json({"type": "error", "message": "Session mismatch"})
        await ws.close()
        return

    async def send_progress(data: dict):
        try:
            await ws.send_json(data)
        except Exception:
            pass  # client may have disconnected

    # Listen for cancel messages from the client in parallel
    async def listen_for_cancel():
        msg_times: list[float] = []
        try:
            while True:
                raw = await ws.receive_text()
                # Rate limit: max 10 messages per second
                now = time.monotonic()
                msg_times.append(now)
                # Keep only messages from the last second
                msg_times[:] = [t for t in msg_times if now - t < 1.0]
                if len(msg_times) > 10:
                    await ws.close(code=4008, reason="Rate limit exceeded")
                    return

                try:
                    msg = json.loads(raw)
                    if msg.get("type") == "cancel":
                        translation_service.cancel_job(job_id)
                except (json.JSONDecodeError, AttributeError):
                    pass
        except (WebSocketDisconnect, Exception):
            pass

    cancel_listener = asyncio.create_task(listen_for_cancel())

    try:
        await translation_service.run_translation(job_id, progress_callback=send_progress)
    except WebSocketDisconnect:
        # Client disconnected — cancel the job so threads stop
        translation_service.cancel_job(job_id)
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        cancel_listener.cancel()
        try:
            await ws.close()
        except Exception:
            pass
