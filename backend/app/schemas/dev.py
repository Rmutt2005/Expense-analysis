from __future__ import annotations

from pydantic import BaseModel, Field


class SeedRequest(BaseModel):
    days: int = Field(default=30, ge=1, le=365)
    seed: int = Field(default=42, ge=0, le=2_000_000_000)


class SeedResponse(BaseModel):
    message: str
    days: int
    categories_created: int
    expenses_created: int

