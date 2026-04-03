"""Session cookie middleware — assigns each browser a persistent UUID."""

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from config import settings


class SessionCookieMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        session_id = request.cookies.get("session_id")
        if not session_id:
            session_id = uuid.uuid4().hex
        request.state.session_id = session_id
        response = await call_next(request)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="lax",
            secure=settings.use_secure_cookies,
            max_age=settings.session_max_age_seconds,
        )
        return response
