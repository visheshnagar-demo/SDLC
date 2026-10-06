import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.database import init_db, seed_data, SessionLocal
from server.routers import (
    auth_router,
    patient_router,
    doctor_router,
    appointment_router,
    ehr_router,
    billing_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed initial data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="CarePulse Hospital Management System API",
    description="Unified API for patient onboarding, doctor scheduling, electronic health records (EHR), and automated billing.",
    version="1.0.0",
    lifespan=lifespan,
)

# Mandatory CORS Middleware
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router.router)
app.include_router(patient_router.router)
app.include_router(doctor_router.router)
app.include_router(appointment_router.router)
app.include_router(ehr_router.router)
app.include_router(billing_router.router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "app": "CarePulse Hospital Management System",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
