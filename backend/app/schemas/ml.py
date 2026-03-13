from __future__ import annotations

from pydantic import BaseModel


class ForecastOut(BaseModel):
    forecast_date: str
    predicted_total: float
    model: str
    train_samples: int
    backtest_mae: float | None
    backtest_samples: int
    trend_baht_per_day: float
    trend_percent_per_day: float
    data_days_used: int
