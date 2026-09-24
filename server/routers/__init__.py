from fastapi import APIRouter
from server.routers.transactions import router as transactions_router
from server.routers.alerts import router as alerts_router
from server.routers.rules import router as rules_router
from server.routers.audit import router as audit_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(rules_router)
api_v1_router.include_router(audit_router)
