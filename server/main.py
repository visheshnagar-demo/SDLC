import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import SessionLocal, init_db, seed_data
from server.routers import approvals, auth, checkin, history, visitors


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables and seed default users
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title="Office Visitor Pass System API",
    description="Backend API for Visitor Pre-Registration, Employee Approvals, Receptionist Check-In/Out, and History Audit.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
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

# Include Routers
app.include_router(auth.router)
app.include_router(visitors.router)
app.include_router(approvals.router)
app.include_router(checkin.router)
app.include_router(history.router)


@app.get("/api/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "office-visitor-pass-api",
        "version": "1.0.0",
    }


@app.get("/api/v1/ready", tags=["Health"])
def readiness_check():
    """Readiness check endpoint."""
    return {"status": "ready"}


@app.get("/", tags=["Root"])
def root():
    """Root landing endpoint."""
    return {
        "message": "Welcome to the Office Visitor Pass System API",
        "documentation": "/docs",
        "health": "/api/v1/health",
    }
