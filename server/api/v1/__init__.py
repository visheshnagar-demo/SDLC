from fastapi import APIRouter
from server.api.v1.payments import router as payments_router
from server.api.v1.refunds import router as refunds_router
from server.api.v1.webhooks import router as webhooks_router
from server.api.v1.audit import router as audit_router
from server.api.v1.jobs import router as jobs_router
from server.api.v1.auth import router as auth_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(payments_router)
api_v1_router.include_router(refunds_router)
api_v1_router.include_router(webhooks_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(auth_router)
