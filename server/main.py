import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from server.database import init_db
from server.config import settings
from server.routers.items import router as items_router
from server.routers.inventory import router as inventory_router
from server.routers.adjustments import router as adjustments_router
from server.routers.alerts import router as alerts_router
from server.routers.warehouses import router as warehouses_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)

allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [
    origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(items_router)
api_v1_router.include_router(inventory_router)
api_v1_router.include_router(adjustments_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(warehouses_router)

app.include_router(api_v1_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "inventory-management-service"}
