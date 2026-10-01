import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.app.api.v1.router import api_router
from server.app.core.config import settings
from server.app.core.database import SessionLocal, init_db, seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize schema and seed users
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/healthz", tags=["health"])
@app.get("/readyz", tags=["health"])
@app.get("/", tags=["health"])
def health_check():
    return {
        "status": "healthy",
        "service": "hospital-management-system",
        "version": "1.0.0",
    }
