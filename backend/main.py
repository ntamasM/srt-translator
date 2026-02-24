"""FastAPI application entry point."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
