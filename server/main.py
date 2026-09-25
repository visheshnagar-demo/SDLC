"""Main server entrypoint for ETL Pipeline.
Provides RESTful management endpoints and direct CLI execution.
"""
import os
import sys
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
from server.etl.config import get_settings
from server.etl.pipeline import run_etl_pipeline

logger = logging.getLogger("server.main")

app = FastAPI(
    title="Cloud SQL to BigQuery ETL Service",
    description="ETL Data Pipeline extracting from PostgreSQL and loading to BigQuery",
    version="1.0.0",
)

# CORS Middleware configuration
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_job_status: Dict[str, Any] = {
    "status": "IDLE",
    "last_run_at": None,
    "extracted_rows": 0,
    "cleaned_rows": 0,
    "loaded_rows": 0,
    "duration_seconds": 0.0,
}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "etl-pipeline"}


@app.get("/api/v1/etl/status")
def get_etl_status():
    """Returns the latest ETL execution status and metrics."""
    return latest_job_status


@app.post("/api/v1/etl/trigger")
def trigger_etl():
    """Triggers the ETL pipeline synchronously."""
    global latest_job_status
    try:
        metrics = run_etl_pipeline()
        latest_job_status = {
            "status": "SUCCESS",
            "last_run_at": metrics.get("target_table"),
            "extracted_rows": metrics.get("extracted_rows", 0),
            "cleaned_rows": metrics.get("cleaned_rows", 0),
            "loaded_rows": metrics.get("loaded_rows", 0),
            "duration_seconds": metrics.get("duration_seconds", 0.0),
        }
        return {"message": "ETL pipeline completed successfully", "metrics": metrics}
    except Exception as exc:
        latest_job_status["status"] = "FAILED"
        logger.error("ETL trigger failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"ETL pipeline execution failed: {str(exc)}") from exc


if __name__ == "__main__":
    try:
        result = run_etl_pipeline()
        sys.exit(0)
    except Exception as exc:
        logger.critical("Server main execution failed: %s", exc, exc_info=True)
        sys.exit(1)
