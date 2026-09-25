import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.database import init_db, seed_data, SessionLocal
from server.routers import tanks, telemetry, alerts, feeding, health, equipment


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Seed initial sample data idempotently
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Smart Aquarium Monitoring Platform API",
    description="Centralized telemetry ingestion, real-time alert thresholds, feeding schedules, fish health logs, and equipment maintenance.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(tanks.router)
app.include_router(telemetry.router)
app.include_router(alerts.router)
app.include_router(feeding.router)
app.include_router(health.router)
app.include_router(equipment.router)


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "aquarium-monitoring-api"}
