"""Data transformation and validation engine."""
import re
import uuid
import json
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)

NULL_LITERALS = {"", "null", "none", "na", "n/a", "nan", "\\n"}


@dataclass
class TransformationResult:
    valid_records: List[Dict[str, Any]] = field(default_factory=list)
    error_records: List[Dict[str, Any]] = field(default_factory=list)
    rows_extracted: int = 0
    rows_transformed: int = 0
    rows_rejected: int = 0


class DataTransformer:
    """Transforms raw extracted CSV data into schema-compliant records."""

    def __init__(self, source_file: str = "gs://sdlc-workspec-store/etl/data/my_file (1).csv"):
        self.source_file = source_file

    @staticmethod
    def sanitize_column_name(col: str) -> str:
        """Sanitizes column name to be BigQuery compatible."""
        col = col.strip().lower()
        col = re.sub(r"[^\w\s]", "_", col)
        col = re.sub(r"\s+", "_", col)
        col = re.sub(r"_+", "_", col).strip("_")
        if not col or col[0].isdigit():
            col = f"col_{col}"
        return col

    @staticmethod
    def clean_cell_value(val: Any) -> Any:
        """Trims strings and normalizes null-like values."""
        if val is None:
            return None
        if pd is not None and pd.isna(val):
            return None
        val_str = str(val).strip()
        if val_str.lower() in NULL_LITERALS:
            return None
        return val_str

    @staticmethod
    def parse_timestamp(val: Optional[str]) -> Optional[str]:
        """Parses string to ISO 8601 UTC timestamp format."""
        if not val:
            return None
        val = str(val).strip()
        if pd is not None:
            try:
                dt = pd.to_datetime(val, utc=True)
                if pd.isna(dt):
                    return None
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                return None
        else:
            formats = [
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%d",
                "%m/%d/%Y",
                "%m/%d/%Y %H:%M:%S",
            ]
            for fmt in formats:
                try:
                    dt = datetime.strptime(val, fmt).replace(tzinfo=timezone.utc)
                    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                except ValueError:
                    continue
            return None

    def transform(self, data: Any) -> TransformationResult:
        """Transforms DataFrame rows or dict list into valid ETL records and rejected records."""
        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Convert input to iterable of sanitized dicts
        rows_to_process = []
        if pd is not None and isinstance(data, pd.DataFrame):
            if not data.empty:
                col_mapping = {col: self.sanitize_column_name(str(col)) for col in data.columns}
                renamed_df = data.rename(columns=col_mapping)
                for _, row in renamed_df.iterrows():
                    rows_to_process.append(row.to_dict())
        elif isinstance(data, list):
            for row in data:
                if isinstance(row, dict):
                    sanitized_row = {self.sanitize_column_name(k): v for k, v in row.items()}
                    rows_to_process.append(sanitized_row)

        result = TransformationResult(rows_extracted=len(rows_to_process))
        if not rows_to_process:
            return result

        for idx, row in enumerate(rows_to_process):
            raw_row_str = json.dumps({k: str(v) for k, v in row.items() if v is not None})
            try:
                cleaned_data: Dict[str, Any] = {}
                row_record_id = None
                created_at_ts = None

                for col_name, val in row.items():
                    cleaned_val = self.clean_cell_value(val)
                    if cleaned_val is None:
                        continue

                    # Check for explicit ID column
                    if (
                        col_name in ("id", "record_id", "item_id", "uuid", "user_id")
                        or col_name.endswith("_id")
                    ) and not row_record_id:
                        row_record_id = cleaned_val

                    # Check for explicit timestamp columns
                    if col_name in ("created_at", "timestamp", "date", "created_date", "updated_at"):
                        ts_parsed = self.parse_timestamp(cleaned_val)
                        if ts_parsed and not created_at_ts:
                            created_at_ts = ts_parsed

                    cleaned_data[col_name] = cleaned_val

                # If no record_id in row, generate one deterministically / uuid
                if not row_record_id:
                    row_record_id = str(uuid.uuid4())

                # Default created_at to ingestion time if missing
                if not created_at_ts:
                    created_at_ts = now_utc

                record = {
                    "record_id": str(row_record_id),
                    "data_payload": json.dumps(cleaned_data),
                    "created_at": created_at_ts,
                    "_ingestion_timestamp": now_utc,
                    "_source_file": self.source_file,
                }
                result.valid_records.append(record)
                result.rows_transformed += 1

            except Exception as exc:
                logger.warning("Row %d failed transformation: %s", idx, exc)
                error_record = {
                    "error_id": str(uuid.uuid4()),
                    "raw_record": raw_row_str,
                    "error_message": str(exc),
                    "_ingestion_timestamp": now_utc,
                    "_source_file": self.source_file,
                }
                result.error_records.append(error_record)
                result.rows_rejected += 1

        return result
