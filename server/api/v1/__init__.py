from fastapi import APIRouter
from server.api.v1.payments import router as payments_router
from server.api.v1.refunds import router as refunds_router
from server.api.v1.webhooks import router as webhooks_router
from server.api.v1.audit import router as audit_router

from server.routers.flocks import router as flocks_router
from server.routers.egg_collections import router as egg_collections_router
from server.routers.feed_inventory import router as feed_inventory_router
from server.routers.health_logs import router as health_logs_router
from server.routers.analytics import router as analytics_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(payments_router)
api_v1_router.include_router(refunds_router)
api_v1_router.include_router(webhooks_router)
api_v1_router.include_router(audit_router)

api_v1_router.include_router(flocks_router)
api_v1_router.include_router(egg_collections_router)
api_v1_router.include_router(feed_inventory_router)
api_v1_router.include_router(health_logs_router)
api_v1_router.include_router(analytics_router)
