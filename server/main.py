"""FastAPI application entrypoint for Garba Management System."""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.routers import auth, events, bookings, passes, gates, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info("Initializing Garba Management System database...")
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
        logger.info("Database initialized and seed data loaded successfully.")
    finally:
        db.close()
    yield
    logger.info("Shutting down Garba Management System...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack Garba Management System API for pass booking, HMAC SHA-256 QR security, real-time gate entry validation, and organizer analytics.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(passes.router, prefix=settings.API_V1_STR)
app.include_router(gates.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to Garba Management System API",
        "docs_url": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
