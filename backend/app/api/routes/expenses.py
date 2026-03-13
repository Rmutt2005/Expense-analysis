from __future__ import annotations

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseUpdate


router = APIRouter(prefix="/expenses", tags=["expenses"])


def _ensure_category_belongs_to_user(db: Session, *, category_id: int, user_id: int) -> None:
    category = db.get(Category, category_id)
    if not category or category.user_id != user_id:
        raise HTTPException(status_code=400, detail="Invalid category_id")


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start: date | None = None,
    end: date | None = None,
) -> list[ExpenseOut]:
    stmt = select(Expense).where(Expense.user_id == current_user.id)
    if start:
        stmt = stmt.where(Expense.spent_at >= start)
    if end:
        stmt = stmt.where(Expense.spent_at <= end)
    stmt = stmt.order_by(Expense.spent_at.desc(), Expense.id.desc())
    rows = db.execute(stmt).scalars().all()
    return [
        ExpenseOut(id=e.id, category_id=e.category_id, amount=e.amount, spent_at=e.spent_at, note=e.note) for e in rows
    ]


@router.post("", response_model=ExpenseOut, status_code=201)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseOut:
    _ensure_category_belongs_to_user(db, category_id=data.category_id, user_id=current_user.id)
    expense = Expense(
        user_id=current_user.id,
        category_id=data.category_id,
        amount=Decimal(data.amount),
        spent_at=data.spent_at,
        note=data.note,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseOut(
        id=expense.id,
        category_id=expense.category_id,
        amount=expense.amount,
        spent_at=expense.spent_at,
        note=expense.note,
    )


@router.patch("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseOut:
    expense = db.get(Expense, expense_id)
    if not expense or expense.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense not found")
    if data.category_id is not None:
        _ensure_category_belongs_to_user(db, category_id=data.category_id, user_id=current_user.id)
        expense.category_id = data.category_id
    if data.amount is not None:
        expense.amount = Decimal(data.amount)
    if data.spent_at is not None:
        expense.spent_at = data.spent_at
    if data.note is not None:
        expense.note = data.note
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseOut(
        id=expense.id,
        category_id=expense.category_id,
        amount=expense.amount,
        spent_at=expense.spent_at,
        note=expense.note,
    )


@router.delete("/{expense_id}", response_model=ExpenseOut)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseOut:
    expense = db.get(Expense, expense_id)
    if not expense or expense.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense not found")
    out = ExpenseOut(
        id=expense.id,
        category_id=expense.category_id,
        amount=expense.amount,
        spent_at=expense.spent_at,
        note=expense.note,
    )
    db.delete(expense)
    db.commit()
    return out
