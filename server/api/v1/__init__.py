from fastapi import APIRouter
from server.api.v1.payments import router as payments_router
from server.api.v1.refunds import router as refunds_router
from server.api.v1.webhooks import router as webhooks_router
from server.api.v1.audit import router as audit_router

from server.api.v1.auth import router as auth_router
from server.api.v1.channels import router as channels_router
from server.api.v1.programs import router as programs_router
from server.api.v1.schedules import router as schedules_router
from server.api.v1.articles import router as articles_router
from server.api.v1.dashboard import router as dashboard_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(channels_router)
api_v1_router.include_router(programs_router)
api_v1_router.include_router(schedules_router)
api_v1_router.include_router(articles_router)
api_v1_router.include_router(dashboard_router)

# Existing routers
api_v1_router.include_router(payments_router)
api_v1_router.include_router(refunds_router)
api_v1_router.include_router(webhooks_router)
api_v1_router.include_router(audit_router)
