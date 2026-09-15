"""Dead-letter queue and quarantine audit service."""
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy.orm import Session
from server.models import QuarantineRecordModel

logger = logging.getLogger("dlq_service")


class DLQService:
    """Handles logging and persistence of invalid records."""

    @staticmethod
    def save_quarantine_records(db: Session, job_id: str, rejected_records: List[Dict[str, Any]]) -> int:
        """Saves rejected records to the quarantine table."""
        if not rejected_records:
            return 0

        saved_count = 0
        try:
            for item in rejected_records:
                q_model = QuarantineRecordModel(
                    quarantine_id=f"dlq_{uuid.uuid4()}",
                    job_id=job_id,
                    raw_record=json.dumps(item.get("raw_record", {})),
                    rejection_reasons=json.dumps(item.get("rejection_reasons", [])),
                    created_at=datetime.now(timezone.utc),
                )
                db.add(q_model)
                saved_count += 1
            db.commit()
            logger.info("Persisted %d quarantine records for job_id %s", saved_count, job_id)
        except Exception as exc:
            db.rollback()
            logger.error("Failed to save quarantine records: %s", exc, exc_info=True)

        return saved_count
