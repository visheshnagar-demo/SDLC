import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db
from server.routers import wires


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Commercial Wire Maker-Checker System",
    description="Backend API for managing commercial wire transfers and dual-approval workflows",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware Configuration
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

# Include Wire Transfer Routers
app.include_router(wires.router, prefix="/api/wires")
app.include_router(wires.router, prefix="/api/v1/wires", include_in_schema=False)


@app.get("/", tags=["health"])
def root():
    return {
        "message": "Commercial Wire Maker-Checker System API",
        "status": "online",
    }


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
