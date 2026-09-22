"""Main FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.config import ALLOWED_ORIGINS
from server.database import SessionLocal, init_db, seed_data
from server.routers import audit, auth, instances, providers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    # Startup: Initialize DB schema and seed initial data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title="Greenfield Cloud Management System API",
    version="1.0.0",
    description="Centralized multi-cloud infrastructure, instance management, and telemetry platform.",
    lifespan=lifespan,
)

# CORS Middleware for fullstack integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(instances.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")


@app.get("/", response_model=dict)
def root():
    """Root health check endpoint."""
    return {
        "service": "Greenfield Cloud Management System",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health", response_model=dict)
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
