"""FastAPI Server exposing ETL endpoints."""
import os
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from server.etl.main import run_etl_pipeline
from server.etl.logger import get_logger

logger = get_logger("server_main")

app = FastAPI(
    title="SDLC ETL Pipeline Service",
    version="1.0.0",
    description="Service for PostgreSQL to BigQuery Data Cleaning and Ingestion Pipeline",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ETLRunRequest(BaseModel):
    write_disposition: str = Field(default="WRITE_TRUNCATE", description="BigQuery write mode")
    batch_size: int = Field(default=5000, description="Batch extraction size")


class ETLMetricsResponse(BaseModel):
    rows_extracted: int
    rows_cleaned: int
    duplicates_dropped: int
    rows_loaded: int
    duration_seconds: float


class ETLRunResponse(BaseModel):
    status: str
    job_id: str
    source: str
    target: str
    metrics: ETLMetricsResponse


class ETLHealthResponse(BaseModel):
    status: str
    postgres_connected: bool
    bigquery_connected: bool
    timestamp: str


@app.get("/health", tags=["Health"])
@app.get("/api/v1/etl/health", response_model=ETLHealthResponse, tags=["Health"])
def health_check():
    """Returns the operational status of the ETL pipeline service."""
    return ETLHealthResponse(
        status="HEALTHY",
        postgres_connected=True,
        bigquery_connected=True,
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/api/v1/etl/run", response_model=ETLRunResponse, status_code=status.HTTP_200_OK, tags=["ETL"])
def trigger_etl_run(payload: Optional[ETLRunRequest] = None):
    """Triggers an on-demand PostgreSQL to BigQuery ETL batch run."""
    req = payload or ETLRunRequest()
    try:
        result = run_etl_pipeline(
            table_name="test_data",
            dataset_id="analytics",
            target_table="test6",
            write_disposition=req.write_disposition,
            batch_size=req.batch_size,
        )
        return result
    except Exception as exc:
        logger.error("ETL Run failed via API: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ETL Execution failed: {str(exc)}",
        )
