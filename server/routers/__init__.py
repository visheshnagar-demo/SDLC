"""API Routers package."""

from server.routers.subjects import router as subjects_router
from server.routers.availability import router as availability_router
from server.routers.schedules import router as schedules_router
from server.routers.health import router as health_router

__all__ = [
    "subjects_router",
    "availability_router",
    "schedules_router",
    "health_router",
]
