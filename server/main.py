import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.database import init_db, seed_data, SessionLocal
from server.routers import auth, devices, users, policies, analytics, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables and seed data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Mobile Management System API",
    description="Central MDM API for tracking mobile inventory, assignments, policies, and remote actions.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
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


@app.get("/")
def root():
    return {"message": "Mobile Management System API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
