from __future__ import annotations

from datetime import date, timedelta

import numpy as np
from fastapi import APIRouter, Depends
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.expense import Expense
from app.models.user import User
from app.schemas.ml import ForecastOut


router = APIRouter(prefix="/ml", tags=["ml"])


def _day_features(d: date) -> tuple[float, float]:
    dow = float(d.weekday())  # 0=Mon..6=Sun
    is_weekend = 1.0 if d.weekday() >= 5 else 0.0
    return dow, is_weekend


def _build_supervised_series(dates: list[date], y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    # Predict total spending for day i using info available up to i-1.
    # Needs at least 7 prior days for lag_7 and rolling_mean_7.
    n = int(y.size)
    if n != len(dates):
        raise ValueError("dates/y length mismatch")
    if n < 8:
        return np.zeros((0, 5), dtype=float), np.zeros((0,), dtype=float)

    rows: list[list[float]] = []
    targets: list[float] = []
    for i in range(7, n):
        d = dates[i]
        dow, is_weekend = _day_features(d)
        lag_1 = float(y[i - 1])
        lag_7 = float(y[i - 7])
        rolling_mean_7 = float(y[i - 7 : i].mean())
        rows.append([dow, is_weekend, lag_1, lag_7, rolling_mean_7])
        targets.append(float(y[i]))
    return np.array(rows, dtype=float), np.array(targets, dtype=float)


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
    series: list[float] = []
    dates: list[date] = []
    for i in range(lookback_days):
        d = start + timedelta(days=i)
        dates.append(d)
        series.append(day_index.get(d, 0.0))
    y = np.array(series, dtype=float)

    model_name = "baseline_mean_last_7"
    train_samples = 0
    backtest_mae: float | None = None
    backtest_samples = 0

    # Baseline fallback (also used for small datasets).
    last7 = y[-7:] if y.size >= 7 else y
    baseline_pred = float(last7.mean()) if last7.size else 0.0

    X_all, y_all = _build_supervised_series(dates, y)
    predicted = baseline_pred

    if X_all.shape[0] >= 14:
        # Train Ridge regression with scaling. Walk-forward backtest to estimate MAE.
        pipe = Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("model", Ridge(alpha=1.0)),
            ]
        )

        preds: list[float] = []
        actuals: list[float] = []
        for i in range(10, X_all.shape[0]):  # ensure some initial training data
            X_train = X_all[:i]
            y_train = y_all[:i]
            X_test = X_all[i : i + 1]
            y_test = y_all[i]
            pipe.fit(X_train, y_train)
            y_hat = float(pipe.predict(X_test)[0])
            preds.append(y_hat)
            actuals.append(float(y_test))

        if preds:
            backtest_samples = len(preds)
            backtest_mae = float(np.mean(np.abs(np.array(preds) - np.array(actuals))))

        # Fit final model on all supervised samples and predict tomorrow.
        pipe.fit(X_all, y_all)
        train_samples = int(X_all.shape[0])
        model_name = "ridge(day_of_week,is_weekend,lag_1,lag_7,rolling_mean_7)"

        tomorrow = end + timedelta(days=1)
        dow, is_weekend = _day_features(tomorrow)
        lag_1 = float(y[-1]) if y.size >= 1 else 0.0
        lag_7 = float(y[-7]) if y.size >= 7 else lag_1
        rolling_mean_7 = float(y[-7:].mean()) if y.size >= 7 else float(y.mean()) if y.size else 0.0
        X_next = np.array([[dow, is_weekend, lag_1, lag_7, rolling_mean_7]], dtype=float)
        predicted = float(pipe.predict(X_next)[0])

    # Spending can't be negative; clamp for display.
    if not np.isfinite(predicted) or predicted < 0:
        predicted = 0.0

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
        predicted_total=float(predicted),
        model=model_name,
        train_samples=train_samples,
        backtest_mae=backtest_mae,
        backtest_samples=backtest_samples,
        trend_baht_per_day=trend_baht_per_day,
        trend_percent_per_day=trend_percent_per_day,
        data_days_used=int(y.size),
    )
