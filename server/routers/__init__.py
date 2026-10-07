from fastapi import APIRouter
from server.routers.rooms import router as rooms_router
from server.routers.guests import router as guests_router
from server.routers.bookings import router as bookings_router
from server.routers.invoices import router as invoices_router
from server.routers.analytics import router as analytics_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(rooms_router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(guests_router, prefix="/guests", tags=["Guests"])
api_router.include_router(bookings_router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
