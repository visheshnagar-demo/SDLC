"""Transformation & Validation Engine.
Cleans whitespace, normalizes types, sanitizes headers, generates metadata.
"""
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

class Transformer:
    def __init__(self, job_id: str, source_file_path: str):
        self.job_id = job_id
        self.source_file_path = source_file_path

    @staticmethod
    def sanitize_column_name(col: str) -> str:
        """Sanitizes column name to valid BigQuery identifier."""
        clean = "".join(c if c.isalnum() or c == "_" else "_" for c in col.strip().lower())
        if clean and clean[0].isdigit():
            clean = f"f_{clean}"
        return clean or "field"

    def transform_records(
        self, raw_records: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Transforms raw records, segregating valid and malformed rows."""
        valid_records: List[Dict[str, Any]] = []
        malformed_records: List[Dict[str, Any]] = []
        now_utc = datetime.now(timezone.utc).isoformat()

        for idx, row in enumerate(raw_records):
            try:
                if not isinstance(row, dict) or not row:
                    malformed_records.append({
                        "error_id": str(uuid.uuid4()),
                        "job_id": self.job_id,
                        "raw_line_content": str(row),
                        "error_reason": "EmptyOrInvalidRecordFormat",
                        "source_file_path": self.source_file_path,
                        "failed_at": now_utc,
                    })
                    continue

                sanitized_fields = {}
                for key, val in row.items():
                    clean_key = self.sanitize_column_name(str(key))
                    clean_val = val.strip() if isinstance(val, str) else val
                    sanitized_fields[clean_key] = clean_val

                record_id = str(uuid.uuid4())
                transformed_record = {
                    "record_id": record_id,
                    "raw_payload": json.dumps(row),
                    "data_fields": json.dumps(sanitized_fields),
                    "ingestion_batch_id": self.job_id,
                    "source_file_path": self.source_file_path,
                    "created_at": now_utc,
                    "updated_at": now_utc,
                }
                valid_records.append(transformed_record)
            except Exception as err:
                logger.error("Failed to transform row index %d: %s", idx, err)
                malformed_records.append({
                    "error_id": str(uuid.uuid4()),
                    "job_id": self.job_id,
                    "raw_line_content": str(row),
                    "error_reason": f"TransformationException: {str(err)}",
                    "source_file_path": self.source_file_path,
                    "failed_at": now_utc,
                })

        logger.info(
            "Transformation completed. Valid records: %d, Malformed records: %d",
            len(valid_records),
            len(malformed_records),
        )
        return valid_records, malformed_records
