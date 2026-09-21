from fastapi import APIRouter
from server.api.v1.payments import router as payments_router
from server.api.v1.refunds import router as refunds_router
from server.api.v1.webhooks import router as webhooks_router
from server.api.v1.audit import router as audit_router
from server.api.v1.tanks import router as tanks_router
from server.api.v1.sensors import router as sensors_router
from server.api.v1.quality import router as quality_router
from server.api.v1.analytics import router as analytics_router
from server.api.v1.alerts import router as alerts_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(payments_router)
api_v1_router.include_router(refunds_router)
api_v1_router.include_router(webhooks_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(tanks_router)
api_v1_router.include_router(sensors_router)
api_v1_router.include_router(quality_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(alerts_router)
