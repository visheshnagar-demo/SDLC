"""Main entry point for AI Study Planner FastAPI application."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.database import init_db, seed_data, SessionLocal
from server.routers import (
    subjects_router,
    availability_router,
    schedules_router,
    health_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    # Seed initial demo subjects and availability
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AI Study Planner API",
    description="Intelligent schedule optimization and priority recommendations for students and learners.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(subjects_router)
app.include_router(availability_router)
app.include_router(schedules_router)
app.include_router(health_router)


@app.get("/")
def root():
    return {
        "app": "AI Study Planner API",
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": "/api/v1",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server.main:app", host="0.0.0.0", port=port, reload=True)
