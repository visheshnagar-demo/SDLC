import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db
from server.routers import wires


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


app = FastAPI(
    title="Commercial Wire Maker-Checker API",
    description="Backend API for Commercial Wire Management with Dual Control and Automated Threshold Approval",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
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
app.include_router(wires.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
