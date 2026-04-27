"""FastAPI application entry point."""

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

from config import settings, ensure_dirs
from logging_config import setup_logging
from middleware.rate_limit import limiter
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.session import SessionCookieMiddleware
from routers import files, health, suggestion_packages, translation
from services.file_service import cleanup_old_files

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run cleanup on startup and periodically in the background."""
    setup_logging()
    ensure_dirs()
    cleanup_old_files()

    async def _periodic_cleanup():
        while True:
            await asyncio.sleep(settings.cleanup_interval_hours * 3600)
            try:
                cleanup_old_files()
            except Exception:
                log.exception("Periodic file cleanup failed")

    task = asyncio.create_task(_periodic_cleanup())
    yield
    task.cancel()


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI app."""
    app = FastAPI(title="SRT Translator API", version="1.0.0", lifespan=lifespan)

    # ── Rate limiter state ───────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Middleware (last added = first executed) ─────────────────────────
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(SessionCookieMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.resolved_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Error handlers ───────────────────────────────────────────────────
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(FileNotFoundError)
    async def file_not_found_handler(request: Request, exc: FileNotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    # ── Routers ──────────────────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(files.router)
    app.include_router(translation.router)
    app.include_router(suggestion_packages.router)

    # ── SPA fallback (production) ────────────────────────────────────────
    _mount_spa(app)

    return app


def _mount_spa(app: FastAPI) -> None:
    """Serve frontend build if available — must be registered last (catch-all)."""
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    if not frontend_dist.exists():
        return

    from fastapi.responses import FileResponse
    from starlette.staticfiles import StaticFiles

    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA fallback: serve the file if it exists, otherwise return index.html."""
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))


app = create_app()
