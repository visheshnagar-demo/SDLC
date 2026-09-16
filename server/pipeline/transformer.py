"""Transformer module for sanitizing, validating, and deduplicating sales order data."""
import logging
from datetime import datetime, timezone
from typing import Dict, Tuple
import pandas as pd

logger = logging.getLogger("sales_orders_etl.transformer")

REQUIRED_COLUMNS = [
    "order_id",
    "customer_id",
    "amount",
    "currency",
    "order_status",
    "created_at",
]

TARGET_COLUMNS = [
    "order_id",
    "customer_id",
    "customer_name",
    "customer_email",
    "product_category",
    "amount",
    "currency",
    "order_status",
    "created_at",
    "ingested_at",
]


class SalesDataTransformer:
    """Cleanses, normalizes types, and deduplicates sales order records."""

    def __init__(self):
        pass

    def transform(
        self, df_raw: pd.DataFrame, execution_time: datetime = None
    ) -> Tuple[pd.DataFrame, Dict[str, int]]:
        """Transforms raw DataFrame into validated, deduplicated, warehouse-ready DataFrame.

        Args:
            df_raw: Raw DataFrame extracted from CSV.
            execution_time: Optional datetime to stamp as ingested_at (defaults to current UTC).

        Returns:
            Tuple containing:
                1. Cleaned and deduplicated DataFrame.
                2. Dictionary of execution metrics (extracted, cleaned, deduplicated, dropped).
        """
        ingest_ts = execution_time or datetime.now(timezone.utc)
        metrics = {
            "records_extracted": len(df_raw),
            "records_valid_schema": 0,
            "records_cleaned": 0,
            "records_deduplicated": 0,
            "records_dropped": 0,
        }

        if df_raw.empty:
            logger.warning("Empty raw DataFrame supplied to transformer.")
            empty_df = pd.DataFrame(columns=TARGET_COLUMNS)
            return empty_df, metrics

        # 1. Clean column headers: strip whitespace and lowercase
        clean_cols = [c.strip().lower() for c in df_raw.columns]
        df = df_raw.copy()
        df.columns = clean_cols

        # Consolidate duplicate columns if header variations resulted in duplicates
        if len(clean_cols) != len(set(clean_cols)):
            combined_series = {}
            unique_cols = list(dict.fromkeys(clean_cols))
            for col_name in unique_cols:
                cols = df[col_name]
                if isinstance(cols, pd.DataFrame):
                    s = cols.iloc[:, 0]
                    for i in range(1, cols.shape[1]):
                        s = s.combine_first(cols.iloc[:, i])
                    combined_series[col_name] = s
                else:
                    combined_series[col_name] = cols
            df = pd.DataFrame(combined_series, index=df.index)

        # Verify presence of mandatory columns
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            error_msg = f"Schema validation failed. Missing mandatory column(s): {missing_cols}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        # Ensure optional columns exist
        for col in ["customer_name", "customer_email", "product_category"]:
            if col not in df.columns:
                df[col] = None

        # 2. Strip whitespace from string columns
        for col in df.select_dtypes(include=["object"]).columns:
            df[col] = df[col].astype(str).str.strip()
            # Replace string representations of null with None
            df[col] = df[col].replace({"nan": None, "None": None, "null": None, "": None})

        # 3. Filter rows with null mandatory fields
        initial_count = len(df)
        df = df.dropna(subset=["order_id", "customer_id", "created_at", "amount", "currency", "order_status"])
        
        # Filter empty string IDs
        df = df[df["order_id"].str.len() > 0]
        df = df[df["customer_id"].str.len() > 0]

        # 4. Cast amount to float and filter valid positive amounts
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
        df = df.dropna(subset=["amount"])
        df = df[df["amount"] >= 0.0]
        df["amount"] = df["amount"].astype(float)

        # 5. Parse and normalize created_at to UTC timestamp
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)
        df = df.dropna(subset=["created_at"])

        # 6. Normalize currency and status (uppercase)
        df["currency"] = df["currency"].str.upper()
        df["order_status"] = df["order_status"].str.upper()

        cleaned_count = len(df)
        metrics["records_valid_schema"] = cleaned_count
        metrics["records_cleaned"] = cleaned_count

        # 7. Deduplicate records by order_id, retaining the most recent created_at
        # Sort chronologically ascending so keep='last' preserves the newest update
        df_sorted = df.sort_values(by=["created_at"], ascending=True)
        df_deduped = df_sorted.drop_duplicates(subset=["order_id"], keep="last").copy()

        # 8. Enrich with ingested_at audit timestamp
        df_deduped["ingested_at"] = pd.to_datetime(ingest_ts, utc=True)

        # 9. Format output DataFrame
        df_final = df_deduped[TARGET_COLUMNS].reset_index(drop=True)

        deduped_count = len(df_final)
        metrics["records_deduplicated"] = deduped_count
        metrics["records_dropped"] = initial_count - deduped_count

        logger.info(
            f"Transformation complete: {initial_count} extracted -> "
            f"{cleaned_count} cleaned -> {deduped_count} deduplicated ({metrics['records_dropped']} dropped)"
        )

        return df_final, metrics
