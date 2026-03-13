from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    PROJECT_NAME: str = "Daily Spend"
    ENVIRONMENT: str = "dev"  # dev|prod

    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    DATABASE_URL: str = "sqlite:///./app.db"
    API_V1_STR: str = "/api/v1"

    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"  # lax|strict|none
    DB_AUTO_CREATE: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
