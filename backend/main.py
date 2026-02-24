"""FastAPI application entry point."""

import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from routers import files, translation
from config import ensure_dirs
from services.file_service import cleanup_old_files

log = logging.getLogger(__name__)

# Ensure data directories exist at startup
ensure_dirs()

CLEANUP_INTERVAL_HOURS = 1


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run cleanup on startup and periodically in the background."""
    # Initial cleanup
    cleanup_old_files()

    async def _periodic_cleanup():
        while True:
            await asyncio.sleep(CLEANUP_INTERVAL_HOURS * 3600)
            try:
                cleanup_old_files()
            except Exception:
                log.exception("Periodic file cleanup failed")

    task = asyncio.create_task(_periodic_cleanup())
    yield
    task.cancel()


app = FastAPI(title="SRT Translator API", version="1.0.0", lifespan=lifespan)

# CORS — allow all origins (API keys are stored client-side, no server secrets)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Session middleware — assigns each browser a persistent UUID via cookie.
# This is used to isolate file uploads / downloads per user.
# ---------------------------------------------------------------------------
class SessionCookieMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        session_id = request.cookies.get("session_id")
        if not session_id:
            session_id = uuid.uuid4().hex
        request.state.session_id = session_id
        response = await call_next(request)
        # Always set / refresh the cookie (30-day expiry)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="lax",
            max_age=30 * 24 * 60 * 60,
        )
        return response


app.add_middleware(SessionCookieMiddleware)

# Mount routers
app.include_router(files.router)
app.include_router(translation.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve frontend build (production) if available — MUST be last (catch-all)
_frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _frontend_dist.exists():
    from fastapi.responses import FileResponse
    from starlette.staticfiles import StaticFiles

    app.mount("/assets", StaticFiles(directory=str(_frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA fallback: serve the file if it exists, otherwise return index.html."""
        file_path = _frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(_frontend_dist / "index.html"))
