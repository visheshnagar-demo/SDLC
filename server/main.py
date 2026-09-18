import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.database import init_db, seed_data, SessionLocal
from server.routers import auth, devices, users, policies, analytics, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed mandatory accounts/policies/devices
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Mobile Management System API",
    description="Centralized RESTful backend for enterprise mobile device inventory, assignment tracking, compliance policies, and remote actions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(users.router)
app.include_router(policies.router)
app.include_router(analytics.router)
app.include_router(audit.router)


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Mobile Management System API",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Mobile Management System API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
