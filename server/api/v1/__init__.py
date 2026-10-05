from fastapi import APIRouter
from server.api.v1.books import router as books_router
from server.api.v1.patrons import router as patrons_router
from server.api.v1.loans import router as loans_router
from server.api.v1.health import router as health_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(books_router)
api_v1_router.include_router(patrons_router)
api_v1_router.include_router(loans_router)
