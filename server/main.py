import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db
from server.routers import cattle, milking, breeding, feed, health, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/PostgreSQL schema and seed initial data
    init_db()
    yield


app = FastAPI(
    title="Cattle & Dairy Farm Management Platform",
    description="Centralized farm platform for cattle profiling, RFID tracking, milk logging, breeding lifecycles, feed allocation, and veterinary records.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware for full-stack integration
ALLOWED_ORIGINS_RAW = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
)
ALLOWED_ORIGINS = [
    origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(cattle.router)
app.include_router(milking.router)
app.include_router(breeding.router)
app.include_router(feed.router)
app.include_router(health.router)
app.include_router(analytics.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "cattle-dairy-farm-management-service",
        "version": "1.0.0",
    }


@app.get("/api/v1/health")
def api_health_check():
    return {
        "status": "healthy",
        "service": "cattle-dairy-farm-management-service",
    }
