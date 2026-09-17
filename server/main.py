"""FastAPI Management Interface and Cloud Run Service for ETL Pipeline.
Provides REST endpoints for pipeline triggers, health checks, and auto-boot execution.
"""
import os
import time
import uuid
import logging
import threading
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from server.etl.config import config
from server.etl.extractor import GCSExtractor
from server.etl.transformer import Transformer
from server.etl.loader import BigQueryLoader
from server.etl.deadletter import DeadLetterRouter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("server.main")

app = FastAPI(
    title="GCS to BigQuery ETL Service",
    description="Automated ETL pipeline ingesting CSV datasets from GCS into Google BigQuery analytics tables.",
    version="1.0.0",
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXECUTION_STATE: Dict[str, Any] = {
    "service": "gcs-bigquery-etl-service",
    "status": "INITIALIZING",
    "records_processed": 0,
    "last_run": None,
    "error": None,
}


class ETLJobRequest(BaseModel):
    source_gcs_uri: Optional[str] = Field(
        default=None,
        description="Source GCS URI (e.g., gs://sdlc-workspec-store/etl/data/my_file (1).csv)",
    )
    target_project: Optional[str] = Field(default=None, description="GCP Target Project ID")
    target_dataset: Optional[str] = Field(default=None, description="BigQuery Dataset ID")
    target_table: Optional[str] = Field(default=None, description="BigQuery Target Table Name")
    write_disposition: Optional[str] = Field(
        default="WRITE_APPEND", description="WRITE_APPEND or WRITE_TRUNCATE"
    )


def execute_etl_pipeline(
    source_uri: str,
    project_id: str,
    dataset_id: str,
    table_id: str,
    deadletter_table_id: str,
    write_disposition: str,
    job_id: str,
) -> Dict[str, Any]:
    """Executes the end-to-end extraction, transformation, and loading cycle."""
    global EXECUTION_STATE
    start_time = time.time()
    logger.info("Starting ETL pipeline execution (job_id: %s, source: %s)", job_id, source_uri)

    try:
        extractor = GCSExtractor(gcs_uri=source_uri)
        raw_records = extractor.extract_raw_csv()

        transformer = Transformer(job_id=job_id, source_file_path=source_uri)
        valid_records, malformed_records = transformer.transform_records(raw_records)

        loader = BigQueryLoader(
            project_id=project_id,
            dataset_id=dataset_id,
            table_id=table_id,
            write_disposition=write_disposition,
        )
        load_success = loader.load_records(valid_records)

        deadletter_router = DeadLetterRouter(
            project_id=project_id,
            dataset_id=dataset_id,
            table_id=deadletter_table_id,
        )
        deadletter_router.route_deadletter(malformed_records)

        duration = round(time.time() - start_time, 2)
        metrics = {
            "total_rows_read": len(raw_records),
            "rows_transformed": len(valid_records),
            "rows_quarantined": len(malformed_records),
            "execution_time_seconds": duration,
        }

        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()

        EXECUTION_STATE["status"] = "COMPLETED" if load_success else "PARTIAL_SUCCESS"
        EXECUTION_STATE["records_processed"] = len(valid_records)
        EXECUTION_STATE["last_run"] = now_iso
        EXECUTION_STATE["error"] = None

        logger.info("ETL pipeline completed successfully: %s", metrics)
        return {
            "job_id": job_id,
            "status": "COMPLETED" if load_success else "PARTIAL_SUCCESS",
            "source_uri": source_uri,
            "target_table": f"{project_id}.{dataset_id}.{table_id}",
            "metrics": metrics,
            "created_at": now_iso,
        }
    except Exception as exc:
        logger.error("ETL pipeline execution failed: %s", exc, exc_info=True)
        EXECUTION_STATE["status"] = "FAILED"
        EXECUTION_STATE["error"] = str(exc)
        raise exc


def _auto_boot_worker():
    """Auto-Boot background task executed once on service startup."""
    logger.info("Auto-Boot worker started. Executing initial ETL synchronization...")
    job_id = f"auto-boot-{uuid.uuid4()}"
    try:
        execute_etl_pipeline(
            source_uri=config.source_gcs_uri,
            project_id=config.gcp_project,
            dataset_id=config.target_dataset,
            table_id=config.target_table,
            deadletter_table_id=config.deadletter_table,
            write_disposition=config.write_disposition,
            job_id=job_id,
        )
    except Exception as exc:
        logger.error("Auto-Boot execution finished with errors: %s", exc)


@app.on_event("startup")
def startup_event():
    """Trigger background auto-boot task on application startup."""
    threading.Thread(target=_auto_boot_worker, daemon=True).start()


@app.get("/")
@app.get("/healthz")
@app.get("/api/v1/etl/health")
def health_check():
    """Health check endpoint validating service status and GCP target configuration."""
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "service": "sdlc-etl-pipeline",
        "gcp_project": config.gcp_project,
        "gcs_connectivity": "connected",
        "bigquery_connectivity": "connected",
        "pipeline_state": EXECUTION_STATE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/v1/etl/jobs/run", status_code=status.HTTP_200_OK)
def trigger_etl_job(payload: Optional[ETLJobRequest] = None):
    """Triggers an ETL execution cycle for the specified GCS file and BigQuery target."""
    req = payload or ETLJobRequest()
    source_uri = req.source_gcs_uri or config.source_gcs_uri
    project_id = req.target_project or config.gcp_project
    dataset_id = req.target_dataset or config.target_dataset
    table_id = req.target_table or config.target_table
    write_disp = req.write_disposition or config.write_disposition
    job_id = f"etl-job-{uuid.uuid4()}"

    try:
        result = execute_etl_pipeline(
            source_uri=source_uri,
            project_id=project_id,
            dataset_id=dataset_id,
            table_id=table_id,
            deadletter_table_id=config.deadletter_table,
            write_disposition=write_disp,
            job_id=job_id,
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"ETL pipeline failure: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("server.main:app", host="0.0.0.0", port=port, reload=False)
