import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.routers import auth, devices, users, policies, analytics, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema and seed initial data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Mobile Management System API",
    description="API for managing mobile devices, assignments, policies, and remote actions",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Setup
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [
    origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(policies.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "app": "Mobile Management System"}
