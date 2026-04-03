"""Shared FastAPI dependencies — injected via Depends()."""

from fastapi import HTTPException, Request


def get_session_id(request: Request) -> str:
    """Extract and validate the session ID set by SessionCookieMiddleware."""
    session_id = getattr(request.state, "session_id", None)
    if not session_id:
        raise HTTPException(status_code=401, detail="No session")
    return session_id
