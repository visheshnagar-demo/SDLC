from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.config import ALLOWED_ORIGINS
from server.database import init_db, seed_data, SessionLocal
from server.routers import (
    artifacts,
    locations,
    restorations,
    environmental,
    inspections,
    loans
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize schema and seed default data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Museum Artifact Preservation System API",
    version="1.0.0",
    description="Backend API for cataloging artifacts, recording restorations, monitoring micro-climate environmental telemetry, scheduling inspections, and managing inter-museum loans.",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(artifacts.router)
app.include_router(locations.router)
app.include_router(restorations.router)
app.include_router(environmental.router)
app.include_router(inspections.router)
app.include_router(loans.router)


@app.get("/healthz", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Museum Artifact Preservation System API"
    }
