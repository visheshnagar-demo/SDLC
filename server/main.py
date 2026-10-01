"""FastAPI Application Entrypoint for NutriKids Platform."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.app.database import init_db, seed_data, SessionLocal
from server.app.routers import (
    auth,
    profiles,
    meals,
    dashboard,
    rewards,
    quizzes,
    avatars,
)


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
    title="NutriKids Eating Habits Tracker & Nutrition Dashboard API",
    version="1.0.0",
    description="Interactive platform for logging meals, tracking nutrition, earning gamified rewards, and viewing parental health insights.",
    lifespan=lifespan,
)

# CORS Middleware configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(meals.router)
app.include_router(dashboard.router)
app.include_router(rewards.router)
app.include_router(quizzes.router)
app.include_router(avatars.router)


@app.get("/")
def root():
    return {
        "message": "NutriKids API is running",
        "docs_url": "/docs",
        "version": "1.0.0",
    }


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    return {"status": "ready"}
