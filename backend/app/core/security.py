from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_token(*, subject: str, token_type: Literal["access", "refresh"], token_version: int, expires_delta: timedelta) -> str:
    expire = _now_utc() + expires_delta
    to_encode: dict[str, Any] = {
        "sub": subject,
        "typ": token_type,
        "ver": token_version,
        "exp": expire,
        "iat": _now_utc(),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


class TokenPayloadError(Exception):
    pass


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        sub = payload.get("sub")
        typ = payload.get("typ")
        ver = payload.get("ver")
        if not sub or typ not in {"access", "refresh"} or ver is None:
            raise TokenPayloadError("Invalid token payload")
        return payload
    except (JWTError, TokenPayloadError) as exc:
        raise TokenPayloadError("Invalid token") from exc
