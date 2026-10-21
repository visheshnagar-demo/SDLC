from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Seed initial test & admin accounts idempotently
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Mandatory CORS configuration for fullstack Vite/React communication
allowed_origins_raw = settings.ALLOWED_ORIGINS
if isinstance(allowed_origins_raw, str):
    allowed_origins = [
        origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()
    ]
else:
    allowed_origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to CarePulse OS - Hospital Management System API",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
    }


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "hospital-management-system", "version": "1.0.0"}
