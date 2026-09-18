import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.routers import flowers, orders, suppliers, categories, analytics


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
    # Shutdown logic if any
    pass


app = FastAPI(
    title="Flowers Management System API",
    description="RESTful API for managing flower inventory, orders, suppliers, categories, and analytics.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
raw_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
ALLOWED_ORIGINS = [
    origin.strip() for origin in raw_origins.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(flowers.router)
app.include_router(orders.router)
app.include_router(suppliers.router)
app.include_router(categories.router)
app.include_router(analytics.router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to Flowers Management System API",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
