import time
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db, seed_data
from server.models import QuarantinedSalesOrder, RawSalesOrder
from server.schemas import (
    ETLJobRequest,
    ETLJobResponse,
    ETLJobStatusResponse,
    ETLJobMetrics,
    ETLJobBreakdown,
)
from server.services.extractor import PostgresExtractor
from server.services.validator import DataValidationEngine
from server.services.loader import BigQueryLoader
from server.services.audit import AuditService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sales-orders", tags=["ETL Pipeline"])


@router.post(
    "/run",
    response_model=ETLJobResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger the Sales Orders ETL pipeline",
    description="Extracts raw sales orders from PostgreSQL, applies data quality rules (filters missing amounts and invalid emails), and loads cleaned records into BigQuery fct_sales_orders partitioned by order date.",
)
def run_sales_orders_etl(
    request: Optional[ETLJobRequest] = None,
    db: Session = Depends(get_db),
):
    start_time = time.time()
    req = request or ETLJobRequest()

    audit_service = AuditService(db)
    job_log = audit_service.start_job(start_date=req.start_date, end_date=req.end_date)
    job_id = job_log.job_id

    extractor = PostgresExtractor(db)
    validator = DataValidationEngine()
    loader = BigQueryLoader(db)

    total_extracted = 0
    total_loaded = 0
    total_quarantined = 0
    aggregated_breakdown = {"missing_amount": 0, "invalid_email": 0}

    try:
        # Process in batches
        for batch in extractor.extract_batches(
            start_date=req.start_date,
            end_date=req.end_date,
            batch_size=req.batch_size,
        ):
            total_extracted += len(batch)
            valid_records, quarantined, breakdown = validator.process_batch(batch)

            # Record quarantined records
            if quarantined:
                audit_service.record_quarantine(job_id, quarantined)
                total_quarantined += len(quarantined)
                aggregated_breakdown["missing_amount"] += breakdown.get(
                    "missing_amount", 0
                )
                aggregated_breakdown["invalid_email"] += breakdown.get(
                    "invalid_email", 0
                )

            # Ingest cleaned records into BigQuery partitioned destination
            if valid_records:
                loaded_count = loader.load_records(valid_records)
                total_loaded += loaded_count

        duration_ms = int((time.time() - start_time) * 1000)

        audit_service.complete_job(
            job_id=job_id,
            records_extracted=total_extracted,
            records_loaded=total_loaded,
            records_quarantined=total_quarantined,
            breakdown=aggregated_breakdown,
            duration_ms=duration_ms,
        )

        metrics = ETLJobMetrics(
            records_extracted=total_extracted,
            records_loaded=total_loaded,
            records_quarantined=total_quarantined,
            breakdown=ETLJobBreakdown(
                missing_amount=aggregated_breakdown["missing_amount"],
                invalid_email=aggregated_breakdown["invalid_email"],
            ),
            duration_ms=duration_ms,
        )

        return ETLJobResponse(
            job_id=job_id,
            status="COMPLETED",
            metrics=metrics,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        logger.error(f"Pipeline execution failed for job {job_id}: {error_msg}")
        audit_service.fail_job(job_id, error_message=error_msg, duration_ms=duration_ms)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ETL pipeline execution failed: {error_msg}",
        )


@router.get(
    "/status/{job_id}",
    response_model=ETLJobStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ETL job status and telemetry",
)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
):
    audit_service = AuditService(db)
    job_status = audit_service.get_job_status(job_id)
    if not job_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETL job '{job_id}' was not found",
        )
    return job_status


@router.post(
    "/seed",
    status_code=status.HTTP_200_OK,
    summary="Seed source raw_sales_orders with test dataset",
)
def seed_raw_data(db: Session = Depends(get_db)):
    seed_data(db)
    count = db.query(RawSalesOrder).count()
    return {
        "message": "Seeded raw sales orders successfully",
        "raw_orders_count": count,
    }


@router.get(
    "/quarantine/{job_id}",
    status_code=status.HTTP_200_OK,
    summary="Retrieve quarantined records for a job",
)
def get_quarantined_records(job_id: str, db: Session = Depends(get_db)):
    records = db.query(QuarantinedSalesOrder).filter_by(job_id=job_id).all()
    return {
        "job_id": job_id,
        "quarantined_count": len(records),
        "records": [
            {
                "id": r.id,
                "order_id": r.order_id,
                "reason": r.reason,
                "raw_data": r.raw_data,
                "created_at": r.created_at,
            }
            for r in records
        ],
    }
