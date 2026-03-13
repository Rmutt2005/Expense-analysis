from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.csrf import csrf_protect, new_csrf_token
from app.core.config import settings
from app.core.security import (
    TokenPayloadError,
    create_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginIn, MessageOut, RegisterIn, UserOut


router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, *, access: str, refresh: str) -> None:
    response.set_cookie(
        "access_token",
        access,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        "refresh_token",
        refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/api/v1/auth/refresh",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


def _set_csrf_cookie(response: Response) -> None:
    response.set_cookie(
        "csrf_token",
        new_csrf_token(),
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: Session = Depends(get_db)) -> UserOut:
    user = User(email=data.email.lower().strip(), hashed_password=hash_password(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    db.refresh(user)
    return UserOut(id=user.id, email=user.email)


@router.post("/login", response_model=UserOut)
def login(data: LoginIn, response: Response, db: Session = Depends(get_db)) -> UserOut:
    stmt = select(User).where(User.email == data.email.lower().strip())
    user = db.execute(stmt).scalar_one_or_none()
    if not user or not user.is_active or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    access = create_token(
        subject=str(user.id),
        token_type="access",
        token_version=user.token_version,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh = create_token(
        subject=str(user.id),
        token_type="refresh",
        token_version=user.token_version,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    _set_auth_cookies(response, access=access, refresh=refresh)
    _set_csrf_cookie(response)
    return UserOut(id=user.id, email=user.email)


@router.post("/refresh", response_model=UserOut)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> UserOut:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    try:
        payload = decode_token(refresh_token)
    except TokenPayloadError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    if payload.get("typ") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")
    if user.token_version != int(payload["ver"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    access = create_token(
        subject=str(user.id),
        token_type="access",
        token_version=user.token_version,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_new = create_token(
        subject=str(user.id),
        token_type="refresh",
        token_version=user.token_version,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    _set_auth_cookies(response, access=access, refresh=refresh_new)
    _set_csrf_cookie(response)
    return UserOut(id=user.id, email=user.email)


@router.post("/logout", response_model=MessageOut)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
    _: None = Depends(csrf_protect),
) -> MessageOut:
    # Best-effort revoke: bump token_version for the current user, if we can.
    if access_token:
        try:
            payload = decode_token(access_token)
            if payload.get("typ") == "access":
                user = db.get(User, int(payload["sub"]))
                if user:
                    user.token_version += 1
                    db.add(user)
                    db.commit()
        except Exception:
            pass

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
    response.delete_cookie("csrf_token", path="/")
    return MessageOut(message="Logged out")
