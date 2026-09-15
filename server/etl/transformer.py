"""Data transformation and enrichment module."""
from datetime import date, datetime
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4

logger = logging.getLogger("server.etl.transformer")


class DataTransformer:
    def __init__(self, pipeline_run_id: Optional[str] = None):
        self.pipeline_run_id = pipeline_run_id or str(uuid4())

    @staticmethod
    def parse_order_date(val: Any) -> str:
        if isinstance(val, date) and not isinstance(val, datetime):
            return val.isoformat()
        if isinstance(val, datetime):
            return val.date().isoformat()
        if isinstance(val, str):
            clean_str = val.strip().split("T")[0].split(" ")[0]
            parsed = datetime.strptime(clean_str, "%Y-%m-%d").date()
            return parsed.isoformat()
        raise ValueError(f"Unable to parse order_date value: {val}")

    def transform_record(self, record: Dict[str, Any], ingestion_ts: Optional[datetime] = None) -> Dict[str, Any]:
        now_ts = ingestion_ts or datetime.utcnow()
        order_date_iso = self.parse_order_date(record["order_date"])
        return {
            "order_id": str(record["order_id"]),
            "customer_email": str(record["customer_email"]).strip().lower(),
            "amount": round(float(record["amount"]), 2),
            "order_date": order_date_iso,
            "ingestion_timestamp": now_ts.isoformat(),
            "pipeline_run_id": self.pipeline_run_id,
        }

    def transform_batch(self, valid_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        now_ts = datetime.utcnow()
        transformed = [self.transform_record(rec, ingestion_ts=now_ts) for rec in valid_records]
        logger.info("Transformed %d records for run_id %s.", len(transformed), self.pipeline_run_id)
        return transformed
