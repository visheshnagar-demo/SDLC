from fastapi import APIRouter
from server.routes.itineraries import router as itineraries_router
from server.routes.activities import router as activities_router
from server.routes.export import router as export_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(
    itineraries_router, prefix="/itineraries", tags=["Itineraries"]
)
api_v1_router.include_router(
    activities_router, prefix="/itineraries", tags=["Activities"]
)
api_v1_router.include_router(
    export_router, prefix="/itineraries", tags=["Export & Sharing"]
)
