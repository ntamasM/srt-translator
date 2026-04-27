"""Read-only endpoints for curated suggestion packages shipped on disk."""

import json
import logging
from typing import Any

from fastapi import APIRouter, Request

from config import settings
from middleware.rate_limit import limiter

router = APIRouter(prefix="/api/suggestion-packages", tags=["suggestion-packages"])
log = logging.getLogger(__name__)


@router.get("", response_model=list[dict[str, Any]])
@limiter.limit(settings.general_rate_limit)
def list_suggestion_packages(request: Request):
    folder = settings.suggestion_packages_dir
    if not folder.exists():
        return []

    out: list[dict[str, Any]] = []
    for path in sorted(folder.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            log.warning("Skipping invalid suggestion package: %s", path.name)
            continue
        if not isinstance(data, dict) or not data.get("name") or "matchingWords" not in data:
            continue
        data["filename"] = path.name
        raw = data.get("categories")
        if isinstance(raw, list):
            data["categories"] = [str(c).strip() for c in raw if str(c).strip()]
        else:
            data["categories"] = []
        if not data["categories"]:
            data["categories"] = ["Uncategorized"]
        data.pop("category", None)
        out.append(data)
    return out
