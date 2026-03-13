from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.session import engine
from app.models import category, expense, user  # noqa: F401
from app.db.base import Base


app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup_create_tables() -> None:
    # MVP-friendly. For production, prefer Alembic migrations.
    if settings.ENVIRONMENT.lower() == "prod":
        # Fail fast on dangerous defaults.
        if settings.SECRET_KEY == "change-me" or len(settings.SECRET_KEY) < 32:
            raise RuntimeError("SECRET_KEY is too weak for production")
    if settings.DB_AUTO_CREATE:
        Base.metadata.create_all(bind=engine)


app.include_router(api_router, prefix=settings.API_V1_STR)
