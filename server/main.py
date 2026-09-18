import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.services import (
    auth_service,
    devotee_service,
    pooja_service,
    donation_service,
    inventory_service,
    finance_service,
    payment_service,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Ganesh Temple Management System API",
    version="1.0.0",
    description="RESTful API services for Ganesh Temple operations, devotee management, pooja bookings, e-Hundi donations, inventory, and cashier audit.",
    lifespan=lifespan,
)

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

app.include_router(auth_service.router)
app.include_router(devotee_service.router)
app.include_router(pooja_service.router)
app.include_router(donation_service.router)
app.include_router(inventory_service.router)
app.include_router(finance_service.router)
app.include_router(payment_service.router)


@app.get("/healthz", tags=["Health"])
@app.get("/readyz", tags=["Health"])
@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "Ganesh Temple Management System API",
        "version": "1.0.0",
    }
