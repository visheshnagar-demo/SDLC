"""Data transformation and cleaning module for PostgreSQL to BigQuery ETL."""
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
import pandas as pd
from server.schemas.etl_schemas import CleanedPostgresTest5Record, DeadLetterRecord

logger = logging.getLogger(__name__)


class DataTransformer:
    def __init__(self, batch_id: str = None):
        self.batch_id = batch_id or str(uuid.uuid4())

    def transform_records(
        self, raw_records: List[Dict[str, Any]]
    ) -> Tuple[List[CleanedPostgresTest5Record], List[DeadLetterRecord]]:
        """Transforms and sanitizes raw records into cleaned records and dead-letter records."""
        cleaned_records: List[CleanedPostgresTest5Record] = []
        dead_letter_records: List[DeadLetterRecord] = []
        now_utc = datetime.now(timezone.utc)

        for raw in raw_records:
            raw_str = str(raw)
            try:
                raw_id = raw.get("id")
                if raw_id is None or (isinstance(raw_id, float) and pd.isna(raw_id)):
                    dead_letter_records.append(
                        DeadLetterRecord(
                            id=str(uuid.uuid4()),
                            source_record_id=None,
                            raw_record=raw_str,
                            rejection_reason="Missing or null required primary key 'id'",
                            batch_id=self.batch_id,
                            created_at=now_utc,
                        )
                    )
                    continue

                clean_id = str(raw_id).strip()
                if not clean_id or clean_id.lower() in ("nan", "none", "null"):
                    dead_letter_records.append(
                        DeadLetterRecord(
                            id=str(uuid.uuid4()),
                            source_record_id=clean_id,
                            raw_record=raw_str,
                            rejection_reason="Empty or invalid primary key 'id'",
                            batch_id=self.batch_id,
                            created_at=now_utc,
                        )
                    )
                    continue

                # Clean payload_data
                raw_payload = raw.get("payload_data")
                clean_payload: str | None = None
                if raw_payload is not None and not pd.isna(raw_payload):
                    clean_payload = str(raw_payload).strip()
                    if clean_payload.lower() in ("nan", "none", "null", ""):
                        clean_payload = None

                # Clean status
                raw_status = raw.get("status")
                clean_status = "UNKNOWN"
                if raw_status is not None and not pd.isna(raw_status):
                    st = str(raw_status).strip().upper()
                    if st and st not in ("NAN", "NONE", "NULL"):
                        clean_status = st

                # Clean source_created_at
                raw_created = raw.get("source_created_at")
                clean_created: datetime | None = None
                if raw_created is not None and not pd.isna(raw_created):
                    if isinstance(raw_created, datetime):
                        clean_created = raw_created
                    else:
                        try:
                            parsed_dt = pd.to_datetime(raw_created, errors="coerce")
                            if pd.notna(parsed_dt):
                                clean_created = parsed_dt.to_pydatetime()
                        except (ValueError, TypeError, pd.errors.ParserError):
                            clean_created = None

                cleaned_records.append(
                    CleanedPostgresTest5Record(
                        id=clean_id,
                        payload_data=clean_payload,
                        status=clean_status,
                        source_created_at=clean_created,
                        etl_loaded_at=now_utc,
                        etl_batch_id=self.batch_id,
                    )
                )
            except (ValueError, TypeError, KeyError, AttributeError) as e:
                logger.warning("Error transforming record %s: %s", raw, e)
                dead_letter_records.append(
                    DeadLetterRecord(
                        id=str(uuid.uuid4()),
                        source_record_id=str(raw.get("id")) if raw.get("id") is not None else None,
                        raw_record=raw_str,
                        rejection_reason=f"Transformation exception: {str(e)}",
                        batch_id=self.batch_id,
                        created_at=now_utc,
                    )
                )

        logger.info(
            "Transformation complete for batch %s: %d cleaned, %d rejected",
            self.batch_id,
            len(cleaned_records),
            len(dead_letter_records),
        )
        return cleaned_records, dead_letter_records
