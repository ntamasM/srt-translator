"""Backend configuration — centralised settings via environment variables.

All env vars are prefixed with SRT_ (e.g. SRT_ENV, SRT_DEPLOYMENT_URL).
Settings are loaded once at import time and shared as a singleton.
A .env file is required — the app will not start without one.
"""

import sys
from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    # ── Environment (required) ───────────────────────────────────────────────
    env: str = Field(..., description="'development' or 'production'")

    # ── Deployment URL (optional — only needed in production) ────────────────
    deployment_url: str = Field(
        "", description="Production origin URL (e.g. https://srt.example.com)"
    )

    # ── Security ─────────────────────────────────────────────────────────────
    secure_cookies: Optional[bool] = Field(
        None, description="Force secure cookies. Auto-True in production if not set."
    )

    # ── Session & Cleanup ────────────────────────────────────────────────────
    # Single setting: files are cleaned up after this many days, and the
    # session cookie lives 2 extra days so the user never loses access to
    # files that still exist.
    file_max_age_days: int = Field(7, ge=1, le=365)
    cleanup_interval_hours: int = Field(1, ge=1, le=168)

    # ── Uploads ──────────────────────────────────────────────────────────────
    max_upload_size_mb: int = Field(10, ge=1, le=100)
    max_upload_count: int = Field(50, ge=1, le=200)

    # ── Rate limits ──────────────────────────────────────────────────────────
    upload_rate_limit: str = Field("10/minute")
    translate_rate_limit: str = Field("5/minute")
    general_rate_limit: str = Field("60/minute")

    # ── Paths ────────────────────────────────────────────────────────────────
    data_dir: Path = Path(__file__).resolve().parent.parent / "data"

    model_config = {
        "env_prefix": "SRT_",
        "env_file": str(Path(__file__).resolve().parent.parent / ".env"),
        "extra": "ignore",
    }

    @model_validator(mode="after")
    def _validate_production(self):
        """Ensure deployment_url is set when running in production."""
        if self.env == "production" and not self.deployment_url:
            print(
                "WARNING: SRT_ENV=production but SRT_DEPLOYMENT_URL is not set. "
                "CORS will allow same-origin only.",
                file=sys.stderr,
            )
        if self.env not in ("development", "production"):
            raise ValueError(f"SRT_ENV must be 'development' or 'production', got '{self.env}'")
        return self

    # ── Computed helpers ─────────────────────────────────────────────────────

    @property
    def resolved_cors_origins(self) -> list[str]:
        """Return the effective CORS origin list based on environment."""
        if self.env == "production" and self.deployment_url:
            return [self.deployment_url]
        # Development: allow Vite dev server
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def use_secure_cookies(self) -> bool:
        if self.secure_cookies is not None:
            return self.secure_cookies
        return self.is_production

    @property
    def session_max_age_seconds(self) -> int:
        """Session cookie lives 2 days longer than file retention."""
        return (self.file_max_age_days + 2) * 24 * 60 * 60

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def suggestion_packages_dir(self) -> Path:
        return Path(__file__).resolve().parent / "suggestion-packages"


# Singleton — imported by other modules as `from config import settings`
settings = AppSettings()


def ensure_dirs() -> None:
    """Create data directories if they don't exist."""
    for sub in ("subtitles", "translated"):
        (settings.data_dir / sub).mkdir(parents=True, exist_ok=True)
