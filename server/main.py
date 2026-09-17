import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.routers.wires import router as wires_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    # Seed sample data
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Commercial Wire Maker-Checker API",
    description="Dual control wire transfer approval system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for full-stack integration
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
)
allowed_origins = [
    origin.strip() for origin in raw_origins.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount router under both /api and /api/v1 for complete compatibility
app.include_router(wires_router, prefix="/api")
app.include_router(wires_router, prefix="/api/v1")


@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Commercial Wire Maker-Checker API",
        "version": "1.0.0",
    }
