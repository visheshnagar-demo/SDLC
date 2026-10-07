from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db, SessionLocal
from server.seed import seed_data
from server.routers.auth import router as auth_router
from server.routers.cows import router as cows_router
from server.routers.health import router as health_router
from server.routers.milk import router as milk_router
from server.routers.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Seed default users & demo data
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Livestock Cattle Management & Tracking System (Cows System) API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware configuration
allowed_origins = settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(cows_router, prefix=settings.API_V1_PREFIX)
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(milk_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
@app.get("/healthz", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "cows-management-system",
        "database": "connected",
    }
