import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.config import settings
from server.database import init_db
from server.api.v1.etl import router as etl_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("server.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Sales Orders ETL Service...")
    init_db()
    yield
    logger.info("Shutting down Sales Orders ETL Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="PostgreSQL to BigQuery Sales Orders ETL Pipeline Service",
    lifespan=lifespan,
)

# Mandatory CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(etl_router, prefix="/api/v1/etl")


@app.get("/", tags=["General"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/healthz",
    }


@app.get("/healthz", tags=["Health"])
@app.get("/livez", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database_url": settings.DATABASE_URL.split("@")[-1]
        if "@" in settings.DATABASE_URL
        else "configured",
    }
