"""Data transformer module for cleaning, validating, and deduplicating sales records."""

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import logging
from typing import Any, Dict, List, Optional, Tuple
from server.models import ETLBatchMetrics, SalesOrderRecord

logger = logging.getLogger("sales_etl.transformer")


def parse_timestamp(timestamp_str: str) -> datetime:
    """Parses ISO 8601 timestamp string into timezone-aware datetime."""
    s = timestamp_str.strip()
    # Replace trailing 'Z' with '+00:00' if needed for fromisoformat in older pythons
    if s.endswith("Z") or s.endswith("z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


class SalesOrderTransformer:
    """Transformation engine for sales order transactions."""

    def __init__(self, batch_id: str):
        self.batch_id = batch_id

    def transform(self, raw_records: List[Dict[str, Any]]) -> Tuple[List[SalesOrderRecord], ETLBatchMetrics, List[dict]]:
        """Cleans, validates, deduplicates, and enriches raw records.

        Args:
            raw_records: List of raw row dictionaries extracted from source.

        Returns:
            Tuple of (cleaned_records, metrics, quarantined_records)
        """
        raw_count = len(raw_records)
        if raw_count == 0:
            metrics = ETLBatchMetrics(
                batch_id=self.batch_id,
                raw_records=0,
                quarantined_records=0,
                deduplicated_records=0,
                clean_records_to_load=0,
            )
            return [], metrics, []

        now_utc = datetime.now(timezone.utc)
        valid_records: List[SalesOrderRecord] = []
        quarantined: List[dict] = []

        # 1. Row-level sanitization and validation
        for idx, row_dict in enumerate(raw_records):
            try:
                # String sanitization
                raw_order_id = row_dict.get("order_id")
                raw_customer_id = row_dict.get("customer_id")
                raw_product_id = row_dict.get("product_id")
                raw_category = row_dict.get("product_category")
                raw_status = row_dict.get("order_status")

                order_id = str(raw_order_id or "").strip()
                customer_id = str(raw_customer_id or "").strip()
                product_id = str(raw_product_id or "").strip()
                product_category = str(raw_category).strip() if raw_category is not None and str(raw_category).strip() else None
                order_status = str(raw_status or "").strip().upper()

                if not order_id or not customer_id or not product_id or not order_status:
                    raise ValueError("Required string field (order_id, customer_id, product_id, order_status) is empty or missing")

                # Parse and validate quantity
                raw_quantity = row_dict.get("quantity")
                if raw_quantity is None or str(raw_quantity).strip() == "":
                    raise ValueError("Quantity is missing")
                quantity = int(float(str(raw_quantity).strip()))
                if quantity <= 0:
                    raise ValueError(f"Quantity must be positive (> 0), got: {quantity}")

                # Parse and validate unit_price
                raw_unit_price = row_dict.get("unit_price")
                if raw_unit_price is None or str(raw_unit_price).strip() == "":
                    raise ValueError("Unit price is missing")
                unit_price = Decimal(str(raw_unit_price).strip()).quantize(Decimal("0.01"))
                if unit_price < Decimal("0.00"):
                    raise ValueError(f"Unit price must be non-negative, got: {unit_price}")

                # Calculate or validate total_amount
                expected_total = (Decimal(quantity) * unit_price).quantize(Decimal("0.01"))
                raw_total = row_dict.get("total_amount")
                if raw_total is not None and str(raw_total).strip():
                    total_amount = Decimal(str(raw_total).strip()).quantize(Decimal("0.01"))
                    if total_amount != expected_total:
                        logger.debug(f"Correcting total_amount for order {order_id} from {total_amount} to {expected_total}")
                        total_amount = expected_total
                else:
                    total_amount = expected_total

                # Parse and validate created_at timestamp
                raw_created_at = row_dict.get("created_at")
                if raw_created_at is None or str(raw_created_at).strip() == "":
                    raise ValueError("created_at timestamp is missing")

                created_at = parse_timestamp(str(raw_created_at))

                record = SalesOrderRecord(
                    order_id=order_id,
                    customer_id=customer_id,
                    product_id=product_id,
                    product_category=product_category,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_amount=total_amount,
                    order_status=order_status,
                    created_at=created_at,
                    ingested_at=now_utc,
                    batch_id=self.batch_id,
                )
                valid_records.append(record)

            except (ValueError, TypeError, InvalidOperation, Exception) as err:
                quarantine_entry = {
                    "raw_record": row_dict,
                    "error": str(err),
                    "batch_id": self.batch_id,
                    "quarantined_at": now_utc.isoformat(),
                }
                quarantined.append(quarantine_entry)
                logger.warning(f"Record quarantined at index {idx}: {str(err)} | Data: {row_dict}")

        # 2. Deduplication on order_id (retaining the latest record ordered by created_at)
        dedup_count = 0
        final_records: List[SalesOrderRecord] = []

        if valid_records:
            # Group records by order_id
            order_map: Dict[str, SalesOrderRecord] = {}
            for rec in valid_records:
                if rec.order_id in order_map:
                    dedup_count += 1
                    # Keep record with latest created_at
                    if rec.created_at > order_map[rec.order_id].created_at:
                        order_map[rec.order_id] = rec
                else:
                    order_map[rec.order_id] = rec

            final_records = list(order_map.values())

        metrics = ETLBatchMetrics(
            batch_id=self.batch_id,
            raw_records=raw_count,
            quarantined_records=len(quarantined),
            deduplicated_records=dedup_count,
            clean_records_to_load=len(final_records),
        )

        logger.info(
            f"Batch {self.batch_id} transformed: Raw={metrics.raw_records}, "
            f"Quarantined={metrics.quarantined_records}, "
            f"Deduplicated={metrics.deduplicated_records}, "
            f"CleanToLoad={metrics.clean_records_to_load}"
        )

        return final_records, metrics, quarantined
