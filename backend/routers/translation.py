"""Translation API endpoints + WebSocket for real-time progress."""

import asyncio
import json

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from schemas.translation import TranslationRequest, TranslationResult
from services import translation_service

router = APIRouter(tags=["translation"])


@router.post("/api/translate", response_model=TranslationResult)
def start_translation(req: TranslationRequest, request: Request):
    """Create a translation job and return a job_id.

    The actual work runs when a client connects to the WebSocket.
    """
    session_id = getattr(request.state, "session_id", "")
    matching = [{"source": w.source, "target": w.target} for w in req.matching_words]
    settings_dict = req.settings.model_dump()
    job_id = translation_service.create_job(
        req.files,
        session_id=session_id,
        settings=settings_dict,
        matching_words=matching,
        removal_words=req.removal_words,
    )
    return TranslationResult(job_id=job_id, status="started", message="Connect to WebSocket to begin")


@router.post("/api/translate/{job_id}/cancel")
def cancel_translation(job_id: str):
    """Cancel a running translation job."""
    found = translation_service.cancel_job(job_id)
    if not found:
        return {"status": "error", "message": f"Job {job_id} not found"}
    return {"status": "cancelling", "message": "Cancel requested"}


@router.websocket("/ws/translate/{job_id}")
async def translate_ws(ws: WebSocket, job_id: str):
    """WebSocket endpoint that streams translation progress."""
    await ws.accept()

    job = translation_service.get_job(job_id)
    if not job:
        await ws.send_json({"type": "error", "message": f"Job {job_id} not found"})
        await ws.close()
        return

    async def send_progress(data: dict):
        try:
            await ws.send_json(data)
        except Exception:
            pass  # client may have disconnected

    # Listen for cancel messages from the client in parallel
    async def listen_for_cancel():
        try:
            while True:
                raw = await ws.receive_text()
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
