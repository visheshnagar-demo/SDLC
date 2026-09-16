import json
import logging
import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from server.models import ETLJobLog, QuarantinedSalesOrder
from server.schemas import ETLJobMetrics, ETLJobBreakdown, ETLJobStatusResponse

logger = logging.getLogger(__name__)


class AuditService:
    """
    Manages job telemetry, execution state, error logs, and quarantine storage.
    """

    def __init__(self, db: Session):
        self.db = db

    def start_job(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> ETLJobLog:
        """
        Creates and persists a new RUNNING ETL job log.
        """
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        job_log = ETLJobLog(
            job_id=job_id,
            status="RUNNING",
            start_date=start_date,
            end_date=end_date,
            started_at=datetime.utcnow(),
        )
        self.db.add(job_log)
        self.db.commit()
        self.db.refresh(job_log)
        logger.info(f"Started ETL job: {job_id}")
        return job_log

    def record_quarantine(
        self,
        job_id: str,
        quarantined_records: List[Dict[str, Any]],
    ) -> None:
        """
        Persists quarantined records with reason codes for auditing and DLQ inspection.
        """
        if not quarantined_records:
            return

        entries = []
        for q in quarantined_records:
            entries.append(
                QuarantinedSalesOrder(
                    id=str(uuid.uuid4()),
                    job_id=job_id,
                    order_id=str(q.get("order_id", "")),
                    reason=q.get("reason", "UNKNOWN"),
                    raw_data=json.dumps(q.get("raw_data", {}), default=str),
                    created_at=datetime.utcnow(),
                )
            )
        self.db.add_all(entries)
        self.db.commit()
        logger.info(f"Recorded {len(entries)} quarantined records for job {job_id}")

    def complete_job(
        self,
        job_id: str,
        records_extracted: int,
        records_loaded: int,
        records_quarantined: int,
        breakdown: Dict[str, int],
        duration_ms: int,
    ) -> ETLJobLog:
        """
        Marks an ETL job as COMPLETED and records metrics.
        """
        job = self.db.query(ETLJobLog).filter_by(job_id=job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")

        job.status = "COMPLETED"
        job.records_extracted = records_extracted
        job.records_loaded = records_loaded
        job.records_quarantined = records_quarantined
        job.missing_amount = breakdown.get("missing_amount", 0)
        job.invalid_email = breakdown.get("invalid_email", 0)
        job.duration_ms = duration_ms
        job.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(job)
        logger.info(f"Completed ETL job {job_id} in {duration_ms}ms")
        return job

    def fail_job(
        self, job_id: str, error_message: str, duration_ms: int = 0
    ) -> ETLJobLog:
        """
        Marks an ETL job as FAILED with error details.
        """
        job = self.db.query(ETLJobLog).filter_by(job_id=job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")

        job.status = "FAILED"
        job.error_message = error_message
        job.duration_ms = duration_ms
        job.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(job)
        logger.error(f"Failed ETL job {job_id}: {error_message}")
        return job

    def get_job_status(self, job_id: str) -> Optional[ETLJobStatusResponse]:
        """
        Fetches job status and metrics for a given job_id.
        """
        job = self.db.query(ETLJobLog).filter_by(job_id=job_id).first()
        if not job:
            return None

        metrics = ETLJobMetrics(
            records_extracted=job.records_extracted,
            records_loaded=job.records_loaded,
            records_quarantined=job.records_quarantined,
            breakdown=ETLJobBreakdown(
                missing_amount=job.missing_amount,
                invalid_email=job.invalid_email,
            ),
            duration_ms=job.duration_ms,
        )

        progress = 100.0 if job.status in ("COMPLETED", "FAILED") else 50.0

        return ETLJobStatusResponse(
            job_id=job.job_id,
            status=job.status,
            progress_percentage=progress,
            metrics=metrics,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )
