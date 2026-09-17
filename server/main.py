import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.database import init_db, seed_data, SessionLocal
from server.api.v1 import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Seed default data
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Tenant Management System API",
    version="1.0.0",
    description="Multi-tenant organization lifecycle, provisioning, quotas, and configuration management.",
    lifespan=lifespan,
)

# CORS Middleware setup
ALLOWED_ORIGINS_STR = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
ALLOWED_ORIGINS = [
    origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Tenant Management System API"}


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to the Tenant Management System API",
        "docs": "/docs",
        "version": "1.0.0",
    }
