from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    category_id: int
    amount: Decimal = Field(gt=0)
    spent_at: date
    note: str | None = Field(default=None, max_length=255)


class ExpenseUpdate(BaseModel):
    category_id: int | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    spent_at: date | None = None
    note: str | None = Field(default=None, max_length=255)


class ExpenseOut(BaseModel):
    id: int
    category_id: int
    amount: Decimal
    spent_at: date
    note: str | None
