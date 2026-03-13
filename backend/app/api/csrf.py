from __future__ import annotations

import secrets

from fastapi import Cookie, Header, HTTPException, status


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def csrf_protect(
    csrf_token: str | None = Cookie(default=None),
    x_csrf_token: str | None = Header(default=None, alias="X-CSRF-Token"),
) -> None:
    # Double-submit cookie: JS reads csrf_token cookie and echoes it back as header.
    if not csrf_token or not x_csrf_token or csrf_token != x_csrf_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")

