from fastapi import APIRouter

from app.api.routes import analytics, auth, categories, dev, expenses, ml, users


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(expenses.router)
api_router.include_router(analytics.router)
api_router.include_router(ml.router)
api_router.include_router(dev.router)
