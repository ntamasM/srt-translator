"""Rate limiting setup using slowapi — keyed by session cookie."""

from slowapi import Limiter
from starlette.requests import Request


def _key_func(request: Request) -> str:
    """Rate-limit key: use session cookie, fall back to client IP."""
    return request.cookies.get("session_id") or request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_key_func)
