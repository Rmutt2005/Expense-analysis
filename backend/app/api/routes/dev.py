from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.csrf import csrf_protect
from app.core.config import settings
from app.db.session import get_db
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.schemas.dev import SeedRequest, SeedResponse


router = APIRouter(prefix="/dev", tags=["dev"])


DEFAULT_CATEGORIES: list[tuple[str, tuple[int, int]]] = [
    ("ค่ากิน", (40, 250)),
    ("ค่าเดินทาง", (20, 180)),
    ("ช็อปปี้", (50, 900)),
    ("ค่าเครื่องสำอาง", (80, 700)),
    ("ค่าใช้จ่ายอื่นๆ", (20, 300)),
]


@router.post("/seed", response_model=SeedResponse)
def seed_30_days(
    body: SeedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(csrf_protect),
) -> SeedResponse:
    if settings.ENVIRONMENT.lower() == "prod":
        raise HTTPException(status_code=404, detail="Not found")

    rng = random.Random(body.seed)
    today = date.today()
    start = today - timedelta(days=body.days - 1)

    existing = {
        c.name: c
        for c in db.execute(select(Category).where(Category.user_id == current_user.id)).scalars().all()
    }

    categories_created = 0
    categories: list[tuple[Category, tuple[int, int]]] = []
    for name, amt_range in DEFAULT_CATEGORIES:
        if name in existing:
            categories.append((existing[name], amt_range))
            continue
        c = Category(user_id=current_user.id, name=name, is_active=1)
        db.add(c)
        db.flush()
        categories_created += 1
        categories.append((c, amt_range))

    expenses_created = 0
    for i in range(body.days):
        d = start + timedelta(days=i)

        # Some days have no spending, some have multiple entries.
        roll = rng.random()
        if roll < 0.10:
            n_items = 0
        elif roll < 0.70:
            n_items = 1
        elif roll < 0.92:
            n_items = 2
        else:
            n_items = 3

        for _ in range(n_items):
            cat, (lo, hi) = rng.choice(categories)
            amount = Decimal(rng.randint(lo, hi))
            note = None
            if rng.random() < 0.12:
                note = "ตัวอย่าง"
            db.add(
                Expense(
                    user_id=current_user.id,
                    category_id=cat.id,
                    amount=amount,
                    spent_at=d,
                    note=note,
                )
            )
            expenses_created += 1

    db.commit()

    return SeedResponse(
        message="Seeded sample data",
        days=body.days,
        categories_created=categories_created,
        expenses_created=expenses_created,
    )
