from fastapi import APIRouter
from server.routers.api_router import router as api_router
from server.routers.health_log_router import router as health_log_router
from server.routers.metrics_router import router as metrics_router
from server.routers.system_router import router as system_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(api_router)
api_v1_router.include_router(health_log_router)
api_v1_router.include_router(metrics_router)
api_v1_router.include_router(system_router)

__all__ = ["api_v1_router"]
