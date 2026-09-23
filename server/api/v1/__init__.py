from fastapi import APIRouter
from server.api.v1.etl import router as etl_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(etl_router)

try:
    from server.api.v1.payments import router as payments_router

    api_v1_router.include_router(payments_router)
except ImportError:
    pass

try:
    from server.api.v1.refunds import router as refunds_router

    api_v1_router.include_router(refunds_router)
except ImportError:
    pass

try:
    from server.api.v1.webhooks import router as webhooks_router

    api_v1_router.include_router(webhooks_router)
except ImportError:
    pass

try:
    from server.api.v1.audit import router as audit_router

    api_v1_router.include_router(audit_router)
except ImportError:
    pass
