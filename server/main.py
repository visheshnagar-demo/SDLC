import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.routers import categories, suppliers, flowers, orders, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup DB initialization and seeding
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Flowers Management System API",
    description="Comprehensive backend API for flower inventory, orders, suppliers, and analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware (MANDATORY for fullstack projects)
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [
    origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(flowers.router)
app.include_router(orders.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Flowers Management System API",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy"}
