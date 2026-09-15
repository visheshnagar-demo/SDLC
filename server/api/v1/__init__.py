from fastapi import APIRouter
from server.api.v1.auth import router as auth_router
from server.api.v1.users import router as users_router
from server.api.v1.memberships import router as memberships_router
from server.api.v1.classes import router as classes_router
from server.api.v1.bookings import router as bookings_router
from server.api.v1.admin import router as admin_router
from server.api.v1.health import router as health_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(
    memberships_router, prefix="/memberships", tags=["memberships"]
)
api_router.include_router(classes_router, prefix="/classes", tags=["classes"])
api_router.include_router(bookings_router, prefix="/bookings", tags=["bookings"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(health_router, tags=["health"])

__all__ = ["api_router"]
