"""Data cleaning, validation, and deduplication module for the ETL pipeline."""

from datetime import datetime, timezone
import logging
from typing import Optional, Tuple
import uuid
import numpy as np
import pandas as pd
from server.models import ETLBatchMetrics

logger = logging.getLogger(__name__)


class Transformer:
    """Transforms raw sales order data into clean, validated, and deduplicated records."""

    def __init__(self, batch_id: Optional[str] = None):
        self.batch_id = batch_id or str(uuid.uuid4())

    def transform(
        self, df: pd.DataFrame, batch_id: Optional[str] = None
    ) -> Tuple[pd.DataFrame, ETLBatchMetrics]:
        """Clean, validate, and deduplicate raw sales order records.

        Args:
            df: Raw input DataFrame from extractor.
            batch_id: Optional batch UUID override.

        Returns:
            Tuple of (cleaned_df, metrics).
        """
        current_batch_id = batch_id or self.batch_id
        if df is None or df.empty:
            logger.info("Empty DataFrame received for transformation.")
            metrics = ETLBatchMetrics(
                batch_id=current_batch_id,
                raw_records=0,
                quarantined_records=0,
                deduplicated_records=0,
                clean_records_to_load=0,
            )
            empty_df = pd.DataFrame(
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
            return empty_df, metrics

        raw_count = len(df)
        logger.info(
            "Starting transformation for %d raw records (batch_id=%s)",
            raw_count,
            current_batch_id,
        )

        df_work = df.copy()

        # Normalize column names (strip whitespace and convert to lowercase)
        df_work.columns = [str(c).strip().lower() for c in df_work.columns]

        # Ensure expected columns exist
        expected_cols = [
            "order_id",
            "customer_id",
            "product_id",
            "quantity",
            "unit_price",
            "created_at",
        ]
        missing_required = [c for c in expected_cols if c not in df_work.columns]
        if missing_required:
            logger.error("Required columns missing from dataset: %s", missing_required)
            # Quarantine all rows if essential schema is missing
            metrics = ETLBatchMetrics(
                batch_id=current_batch_id,
                raw_records=raw_count,
                quarantined_records=raw_count,
                deduplicated_records=0,
                clean_records_to_load=0,
            )
            return pd.DataFrame(), metrics

        if "product_category" not in df_work.columns:
            df_work["product_category"] = None
        if "total_amount" not in df_work.columns:
            df_work["total_amount"] = np.nan
        if "order_status" not in df_work.columns:
            df_work["order_status"] = "COMPLETED"

        # 1. Clean whitespace on string columns
        string_cols = [
            "order_id",
            "customer_id",
            "product_id",
            "product_category",
            "order_status",
        ]
        for col in string_cols:
            if col in df_work.columns:
                df_work[col] = df_work[col].apply(
                    lambda v: v.strip() if isinstance(v, str) and pd.notna(v) else v
                )

        # 2. Validation & Quarantining
        valid_mask = pd.Series(True, index=df_work.index)

        # Validate non-empty required string identifiers
        for col in ["order_id", "customer_id", "product_id"]:
            col_valid = (
                df_work[col].notna()
                & (df_work[col].astype(str).str.strip() != "")
                & (df_work[col].astype(str).str.lower() != "nan")
            )
            valid_mask = valid_mask & col_valid

        # Validate and coerce quantity
        quantity_numeric = pd.to_numeric(df_work["quantity"], errors="coerce")
        quantity_valid = (
            quantity_numeric.notna()
            & (quantity_numeric > 0)
            & (quantity_numeric == quantity_numeric.round())
        )
        valid_mask = valid_mask & quantity_valid

        # Validate and coerce unit_price
        unit_price_numeric = pd.to_numeric(df_work["unit_price"], errors="coerce")
        unit_price_valid = unit_price_numeric.notna() & (unit_price_numeric >= 0)
        valid_mask = valid_mask & unit_price_valid

        # Validate and coerce created_at timestamp with mixed ISO formats support
        created_at_dt = pd.to_datetime(
            df_work["created_at"], errors="coerce", utc=True, format="mixed"
        )
        created_at_valid = created_at_dt.notna()
        valid_mask = valid_mask & created_at_valid

        # Validate and coerce total_amount
        total_amount_numeric = pd.to_numeric(df_work["total_amount"], errors="coerce")

        quarantined_count = int((~valid_mask).sum())
        if quarantined_count > 0:
            logger.warning(
                "Quarantined %d invalid records failing data quality checks.",
                quarantined_count,
            )

        df_valid = df_work[valid_mask].copy()

        if df_valid.empty:
            metrics = ETLBatchMetrics(
                batch_id=current_batch_id,
                raw_records=raw_count,
                quarantined_records=quarantined_count,
                deduplicated_records=0,
                clean_records_to_load=0,
            )
            return pd.DataFrame(), metrics

        # Apply coerced clean types
        df_valid["quantity"] = quantity_numeric[valid_mask].astype(int)
        df_valid["unit_price"] = unit_price_numeric[valid_mask].astype(float)

        # Calculate or fill total_amount if missing or invalid
        calculated_total = (df_valid["quantity"] * df_valid["unit_price"]).round(2)
        valid_totals = total_amount_numeric[valid_mask]
        df_valid["total_amount"] = np.where(
            valid_totals.notna() & (valid_totals >= 0),
            valid_totals.astype(float),
            calculated_total,
        )

        df_valid["created_at"] = created_at_dt[valid_mask]

        # Normalize default order status if empty/null
        df_valid["order_status"] = df_valid["order_status"].apply(
            lambda s: str(s).strip()
            if pd.notna(s) and str(s).strip() != ""
            else "COMPLETED"
        )

        # Normalize product_category: convert nan/None to None cleanly
        df_valid["product_category"] = df_valid["product_category"].apply(
            lambda c: str(c).strip()
            if pd.notna(c) and str(c).strip() != "" and str(c).lower() != "nan"
            else None
        )

        # 3. Deduplication on order_id
        valid_before_dedup = len(df_valid)
        df_dedup = df_valid.drop_duplicates(subset=["order_id"], keep="first").copy()
        deduplicated_count = valid_before_dedup - len(df_dedup)
        if deduplicated_count > 0:
            logger.info(
                "Deduplicated %d duplicate records on unique order_id",
                deduplicated_count,
            )

        # 4. Add pipeline metadata
        ingestion_time = datetime.now(timezone.utc)
        df_dedup["ingested_at"] = ingestion_time
        df_dedup["batch_id"] = current_batch_id

        # Reorder columns to match canonical schema
        final_columns = [
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
        clean_df = df_dedup[final_columns].reset_index(drop=True)
        clean_count = len(clean_df)

        metrics = ETLBatchMetrics(
            batch_id=current_batch_id,
            raw_records=raw_count,
            quarantined_records=quarantined_count,
            deduplicated_records=deduplicated_count,
            clean_records_to_load=clean_count,
        )

        logger.info(
            "Transformation complete: raw=%d, quarantined=%d, deduped=%d, clean=%d",
            raw_count,
            quarantined_count,
            deduplicated_count,
            clean_count,
        )
        return clean_df, metrics
