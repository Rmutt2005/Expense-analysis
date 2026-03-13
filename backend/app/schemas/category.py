from __future__ import annotations

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    is_active: int | None = Field(default=None, ge=0, le=1)


class CategoryOut(BaseModel):
    id: int
    name: str
    is_active: int
