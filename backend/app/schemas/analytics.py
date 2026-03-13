from __future__ import annotations

from pydantic import BaseModel


class CategorySummary(BaseModel):
    category_id: int
    category_name: str
    total_amount: float
    avg_per_day: float
    percent_of_total: float


class SummaryOut(BaseModel):
    start: str
    end: str
    days: int
    grand_total: float
    by_category: list[CategorySummary]
