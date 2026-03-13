from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.schemas.analytics import CategorySummary, SummaryOut


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=SummaryOut)
def summary(
    start: date,
    end: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SummaryOut:
    if end < start:
        raise HTTPException(status_code=400, detail="end must be >= start")
    days = (end - start).days + 1

    stmt = (
        select(
            Category.id.label("category_id"),
            Category.name.label("category_name"),
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
        )
        .select_from(Category)
        .join(
            Expense,
            and_(
                Expense.category_id == Category.id,
                Expense.user_id == current_user.id,
                Expense.spent_at >= start,
                Expense.spent_at <= end,
            ),
            isouter=True,
        )
        .where(Category.user_id == current_user.id)
        .group_by(Category.id, Category.name)
        .order_by(func.sum(Expense.amount).desc().nullslast(), Category.name.asc())
    )

    rows = db.execute(stmt).all()
    grand_total = float(sum(float(r.total_amount) for r in rows))
    by_category: list[CategorySummary] = []
    for r in rows:
        total_amount = float(r.total_amount)
        percent = 0.0 if grand_total <= 0 else (total_amount / grand_total) * 100.0
        by_category.append(
            CategorySummary(
                category_id=int(r.category_id),
                category_name=str(r.category_name),
                total_amount=total_amount,
                avg_per_day=total_amount / days,
                percent_of_total=percent,
            )
        )

    return SummaryOut(
        start=start.isoformat(),
        end=end.isoformat(),
        days=days,
        grand_total=grand_total,
        by_category=by_category,
    )
