from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MlModel(Base):
    __tablename__ = "ml_models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    model_key: Mapped[str] = mapped_column(String(80), index=True, nullable=False)  # e.g. "ridge_v1"
    lookback_days: Mapped[int] = mapped_column(Integer, nullable=False)

    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    blob: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    backtest_mae: Mapped[float | None] = mapped_column(nullable=True)
    backtest_samples: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
