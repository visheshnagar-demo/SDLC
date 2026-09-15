"""Main application entrypoint for Sales ETL Pipeline Service."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.api.etl_controller import router as etl_router
from server.database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sales Data ETL Pipeline Service",
    description="PostgreSQL to BigQuery partitioned ETL pipeline microservice",
    version="1.0.0",
)

# CORS configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(etl_router)


@app.get("/")
def root():
    return {
        "service": "Sales Data ETL Pipeline",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/api/v1/health",
    }
