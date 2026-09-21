from server.routers.items import router as items_router
from server.routers.warehouses import router as warehouses_router
from server.routers.inventory import router as inventory_router
from server.routers.adjustments import router as adjustments_router
from server.routers.alerts import router as alerts_router

__all__ = [
    "items_router",
    "warehouses_router",
    "inventory_router",
    "adjustments_router",
    "alerts_router",
]
