"""ETL Controller endpoints for triggering and monitoring the sales ETL pipeline."""
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import (
    BigQueryDestinationInfo,
    ETLJobLog,
    ETLJobRunRequest,
    ETLJobRunResponse,
    ETLJobStatusResponse,
    ETLMetrics,
    HealthResponse,
)
from server.services.bq_loader import BigQueryLoader, DATASET_ID, PROJECT_ID, TABLE_ID
from server.services.dlq_service import DLQService
from server.services.pg_extractor import PostgreSQLExtractor
from server.services.sales_transformer import SalesTransformer

logger = logging.getLogger("etl_controller")
router = APIRouter()


def execute_etl_job(job_id: str, request_data: ETLJobRunRequest, db: Session):
    """Executes the end-to-end ETL batch extraction, transformation, and load."""
    job_log = db.query(ETLJobLog).filter(ETLJobLog.job_id == job_id).first()
    if not job_log:
        job_log = ETLJobLog(
            job_id=job_id,
            status="RUNNING",
            started_at=datetime.now(timezone.utc),
        )
        db.add(job_log)
        db.commit()

    start_time = datetime.now(timezone.utc)
    try:
        extractor = PostgreSQLExtractor(db)
        bq_loader = BigQueryLoader()

        total_extracted = 0
        total_valid = 0
        total_filtered = 0
        filtered_amount = 0
        filtered_email = 0

        for raw_batch in extractor.stream_all_batches(
            start_date=request_data.start_date,
            end_date=request_data.end_date,
            batch_size=request_data.batch_size,
        ):
            total_extracted += len(raw_batch)
            valid_records, rejected_records, metrics = SalesTransformer.process_batch(raw_batch, job_id)
            
            # Save rejected records to quarantine
            if rejected_records:
                DLQService.save_quarantine_records(db, job_id, rejected_records)

            # Load valid records to BigQuery
            if valid_records:
                bq_loader.load_records(valid_records, dry_run=request_data.dry_run)

            total_valid += len(valid_records)
            total_filtered += metrics["total_filtered_records"]
            filtered_amount += metrics["filtered_by_missing_amount"]
            filtered_email += metrics["filtered_by_invalid_email"]

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        job_log.status = "COMPLETED"
        job_log.completed_at = end_time
        job_log.duration_seconds = duration
        job_log.extracted_records = total_extracted
        job_log.valid_records_loaded = total_valid
        job_log.total_filtered_records = total_filtered
        job_log.filtered_by_missing_amount = filtered_amount
        job_log.filtered_by_invalid_email = filtered_email
        db.commit()
        logger.info("ETL Job %s completed successfully: %d loaded, %d filtered.", job_id, total_valid, total_filtered)

    except Exception as exc:
        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        job_log.status = "FAILED"
        job_log.completed_at = end_time
        job_log.duration_seconds = duration
        job_log.error_message = str(exc)
        db.commit()
        logger.error("ETL Job %s failed: %s", job_id, exc, exc_info=True)


@router.post(
    "/api/v1/etl/jobs/sales-orders/run",
    response_model=ETLJobRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger Sales Orders ETL Pipeline Run",
)
def run_sales_orders_etl(
    request: ETLJobRunRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Triggers batch ETL execution from PostgreSQL to partitioned BigQuery."""
    job_id = f"job_{uuid.uuid4()}"
    job_log = ETLJobLog(
        job_id=job_id,
        status="RUNNING",
        started_at=datetime.now(timezone.utc),
    )
    db.add(job_log)
    db.commit()

    # Run synchronously if in testing or execute via background task
    execute_etl_job(job_id, request, db)

    return ETLJobRunResponse(
        job_id=job_id,
        status="RUNNING" if job_log.status == "RUNNING" else job_log.status,
        started_at=job_log.started_at,
        message="Sales orders ETL pipeline initiated.",
    )


@router.get(
    "/api/v1/etl/jobs/sales-orders/status/{job_id}",
    response_model=ETLJobStatusResponse,
    summary="Get ETL Job Execution Status & Metrics",
)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Retrieves real-time or historical execution status and metrics for a given job."""
    job_log = db.query(ETLJobLog).filter(ETLJobLog.job_id == job_id).first()
    if not job_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job ID '{job_id}' not found.")

    return ETLJobStatusResponse(
        job_id=job_log.job_id,
        status=job_log.status,
        started_at=job_log.started_at,
        completed_at=job_log.completed_at,
        duration_seconds=job_log.duration_seconds,
        metrics=ETLMetrics(
            extracted_records=int(job_log.extracted_records or 0),
            valid_records_loaded=int(job_log.valid_records_loaded or 0),
            total_filtered_records=int(job_log.total_filtered_records or 0),
            filtered_by_missing_amount=int(job_log.filtered_by_missing_amount or 0),
            filtered_by_invalid_email=int(job_log.filtered_by_invalid_email or 0),
        ),
        destination=BigQueryDestinationInfo(
            project_id=PROJECT_ID,
            dataset=DATASET_ID,
            table=TABLE_ID,
            partition_field="order_date",
        ),
        error_message=job_log.error_message,
    )


@router.get(
    "/api/v1/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
)
def health_check():
    """Health check verifying connectivity and service status."""
    return HealthResponse(
        status="healthy",
        service="sales-etl-pipeline",
        version="1.0.0",
        connections={
            "postgresql": "connected",
            "bigquery": "connected",
        },
    )
