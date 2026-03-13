from __future__ import annotations

from datetime import date, timedelta

import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.expense import Expense
from app.models.user import User
from app.schemas.ml import ForecastOut


router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/forecast", response_model=ForecastOut)
def forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    lookback_days: int = 30,
) -> ForecastOut:
    lookback_days = max(7, min(lookback_days, 365))
    end = date.today()
    start = end - timedelta(days=lookback_days - 1)

    stmt = (
        select(Expense.spent_at, func.coalesce(func.sum(Expense.amount), 0).label("total"))
        .where(Expense.user_id == current_user.id)
        .where(Expense.spent_at >= start)
        .where(Expense.spent_at <= end)
        .group_by(Expense.spent_at)
        .order_by(Expense.spent_at.asc())
    )
    rows = db.execute(stmt).all()

    # Build dense daily series (fill missing days with 0).
    day_index = {r.spent_at: float(r.total) for r in rows}
    series = []
    for i in range(lookback_days):
        d = start + timedelta(days=i)
        series.append(day_index.get(d, 0.0))
    y = np.array(series, dtype=float)

    # Baseline: predict tomorrow as mean of last 7 days.
    last7 = y[-7:] if y.size >= 7 else y
    predicted = float(last7.mean()) if last7.size else 0.0

    # Trend: slope of linear fit (baht/day) over lookback window.
    x = np.arange(y.size, dtype=float)
    if y.size >= 2 and np.any(y != y[0]):
        slope, _ = np.polyfit(x, y, 1)  # y ≈ slope*x + intercept
        trend_baht_per_day = float(slope)
    else:
        trend_baht_per_day = 0.0

    avg = float(y.mean()) if y.size else 0.0
    trend_percent_per_day = 0.0 if avg <= 0 else (trend_baht_per_day / avg) * 100.0

    return ForecastOut(
        forecast_date=(end + timedelta(days=1)).isoformat(),
        predicted_total=predicted,
        trend_baht_per_day=trend_baht_per_day,
        trend_percent_per_day=trend_percent_per_day,
        data_days_used=int(y.size),
    )
