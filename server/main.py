from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.routers import (
    items_router,
    warehouses_router,
    inventory_router,
    adjustments_router,
    alerts_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Mandatory CORS configuration for full-stack integration
allowed_origins = [
    origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(items_router)
app.include_router(warehouses_router)
app.include_router(inventory_router)
app.include_router(adjustments_router)
app.include_router(alerts_router)


@app.get("/health", tags=["health"])
@app.get("/api/v1/health", tags=["health"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
