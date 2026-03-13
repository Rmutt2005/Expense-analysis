from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate


router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_inactive: bool = False,
) -> list[CategoryOut]:
    stmt = select(Category).where(Category.user_id == current_user.id)
    if not include_inactive:
        stmt = stmt.where(Category.is_active == 1)
    stmt = stmt.order_by(Category.name.asc())
    rows = db.execute(stmt).scalars().all()
    return [CategoryOut(id=c.id, name=c.name, is_active=c.is_active) for c in rows]


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryOut:
    category = Category(user_id=current_user.id, name=data.name.strip(), is_active=1)
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category name already exists")
    db.refresh(category)
    return CategoryOut(id=category.id, name=category.name, is_active=category.is_active)


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryOut:
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")
    if data.name is not None:
        category.name = data.name.strip()
    if data.is_active is not None:
        category.is_active = int(data.is_active)
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category name already exists")
    db.refresh(category)
    return CategoryOut(id=category.id, name=category.name, is_active=category.is_active)


@router.delete("/{category_id}", response_model=CategoryOut)
def archive_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryOut:
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")
    category.is_active = 0
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryOut(id=category.id, name=category.name, is_active=category.is_active)
