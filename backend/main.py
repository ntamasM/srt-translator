"""FastAPI application entry point."""

import uuid
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from routers import files, translation
from config import ensure_dirs

# Ensure data directories exist at startup
ensure_dirs()

app = FastAPI(title="SRT Translator API", version="1.0.0")

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
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="frontend")
