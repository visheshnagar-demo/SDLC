import logging
import uuid
from datetime import datetime, timezone
from typing import Tuple, List, Dict, Any, Optional
import pandas as pd
from server.models import ETLBatchMetrics

logger = logging.getLogger(__name__)


def clean_string_field(val: Any) -> Optional[str]:
    """Trim whitespace and return clean string or None."""
    if pd.isna(val) or val is None:
        return None
    val_str = str(val).strip()
    return val_str if val_str else None


def parse_datetime_field(val: Any) -> Optional[datetime]:
    """Parse string or timestamp to UTC datetime, returning None on failure."""
    if pd.isna(val) or val is None:
        return None
    try:
        dt = pd.to_datetime(val, utc=True)
        if pd.isna(dt):
            return None
        return dt.to_pydatetime()
    except Exception:
        return None


def transform_sales_data(
    raw_df: pd.DataFrame,
    batch_id: Optional[str] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, ETLBatchMetrics]:
    """
    Clean, validate, quarantine, and deduplicate raw sales order records.

    Returns:
        (clean_df, quarantined_df, metrics)
    """
    active_batch_id = batch_id or str(uuid.uuid4())
    raw_count = len(raw_df) if raw_df is not None else 0
    now_utc = datetime.now(timezone.utc)

    if raw_df is None or raw_df.empty:
        logger.info("Empty raw dataframe passed to transformer.")
        metrics = ETLBatchMetrics(
            batch_id=active_batch_id,
            raw_records=0,
            quarantined_records=0,
            deduplicated_records=0,
            clean_records_to_load=0,
        )
        empty_clean = pd.DataFrame(
            columns=[
                "order_id",
                "customer_id",
                "product_id",
                "product_category",
                "quantity",
                "unit_price",
                "total_amount",
                "order_status",
                "created_at",
                "ingested_at",
                "batch_id",
            ]
        )
        return empty_clean, pd.DataFrame(), metrics

    clean_records: List[Dict[str, Any]] = []
    quarantined_records: List[Dict[str, Any]] = []

    for idx, row in raw_df.iterrows():
        raw_dict = row.to_dict()
        order_id = clean_string_field(row.get("order_id"))
        customer_id = clean_string_field(row.get("customer_id"))
        product_id = clean_string_field(row.get("product_id"))
        product_category = clean_string_field(row.get("product_category"))
        order_status = clean_string_field(row.get("order_status")) or "COMPLETED"

        # Validate mandatory string IDs
        if not order_id or not customer_id or not product_id:
            raw_dict["quarantine_reason"] = (
                "Missing required identifier (order_id, customer_id, or product_id)"
            )
            quarantined_records.append(raw_dict)
            continue

        # Validate & parse quantity
        try:
            quantity_val = row.get("quantity")
            if pd.isna(quantity_val):
                raise ValueError("Null quantity")
            quantity = int(float(quantity_val))
            if quantity <= 0:
                raise ValueError("Quantity must be greater than zero")
        except Exception as e:
            raw_dict["quarantine_reason"] = f"Invalid quantity: {e}"
            quarantined_records.append(raw_dict)
            continue

        # Validate & parse unit_price
        try:
            price_val = row.get("unit_price")
            if pd.isna(price_val):
                raise ValueError("Null unit_price")
            unit_price = float(price_val)
            if unit_price < 0.0:
                raise ValueError("Unit price cannot be negative")
        except Exception as e:
            raw_dict["quarantine_reason"] = f"Invalid unit_price: {e}"
            quarantined_records.append(raw_dict)
            continue

        # Validate total_amount or calculate from quantity * unit_price
        try:
            total_val = row.get("total_amount")
            if pd.isna(total_val) or total_val is None:
                total_amount = round(quantity * unit_price, 2)
            else:
                total_amount = round(float(total_val), 2)
                if total_amount < 0.0:
                    raise ValueError("Total amount cannot be negative")
        except Exception as e:
            raw_dict["quarantine_reason"] = f"Invalid total_amount: {e}"
            quarantined_records.append(raw_dict)
            continue

        # Validate & parse created_at timestamp
        created_at_dt = parse_datetime_field(row.get("created_at"))
        if created_at_dt is None:
            raw_dict["quarantine_reason"] = (
                "Invalid or unparseable created_at timestamp"
            )
            quarantined_records.append(raw_dict)
            continue

        clean_records.append(
            {
                "order_id": order_id,
                "customer_id": customer_id,
                "product_id": product_id,
                "product_category": product_category,
                "quantity": quantity,
                "unit_price": unit_price,
                "total_amount": total_amount,
                "order_status": order_status,
                "created_at": created_at_dt,
                "ingested_at": now_utc,
                "batch_id": active_batch_id,
            }
        )

    # Convert to DataFrame
    intermediate_clean_df = pd.DataFrame(clean_records)
    quarantined_df = pd.DataFrame(quarantined_records)
    quarantine_count = len(quarantined_records)

    # Deduplication on order_id
    dedup_count = 0
    if not intermediate_clean_df.empty:
        before_dedup_count = len(intermediate_clean_df)
        final_clean_df = intermediate_clean_df.drop_duplicates(
            subset=["order_id"], keep="last"
        ).copy()
        dedup_count = before_dedup_count - len(final_clean_df)
    else:
        final_clean_df = intermediate_clean_df

    clean_count = len(final_clean_df)

    metrics = ETLBatchMetrics(
        batch_id=active_batch_id,
        raw_records=raw_count,
        quarantined_records=quarantine_count,
        deduplicated_records=dedup_count,
        clean_records_to_load=clean_count,
    )

    logger.info(
        "Transformation completed for batch %s: raw=%d, quarantined=%d, deduplicated=%d, clean=%d",
        active_batch_id,
        raw_count,
        quarantine_count,
        dedup_count,
        clean_count,
    )

    return final_clean_df, quarantined_df, metrics
