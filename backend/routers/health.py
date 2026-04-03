"""Health check and public config endpoints."""

from fastapi import APIRouter

from config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health():
    return {"status": "ok"}


@router.get("/api/config")
def public_config():
    """Return non-sensitive configuration values for the frontend."""
    return {
        "file_max_age_days": settings.file_max_age_days,
        "max_upload_size_mb": settings.max_upload_size_mb,
        "max_upload_count": settings.max_upload_count,
    }
