from __future__ import annotations

from pydantic import BaseModel


class ForecastOut(BaseModel):
    forecast_date: str
    predicted_total: float
    trend_baht_per_day: float
    trend_percent_per_day: float
    data_days_used: int
