"""Data Transformation and Cleaning Module.

Cleans and standardizes raw extracted records according to target specifications.
"""
import re
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger("pipeline.transformer")


class DataTransformer:
    """Transforms raw PostgreSQL records into target BigQuery schema format."""

    def __init__(self, circuit_breaker_threshold_pct: float = 100.0):
        self.circuit_breaker_threshold_pct = circuit_breaker_threshold_pct

    def clean_text(self, val):
        """Trims whitespace and normalizes empty / placeholder strings to None."""
        if pd.isna(val) or val is None:
            return None
        s = str(val).strip()
        if s.lower() in ("", "none", "nan", "null", "n/a"):
            return None
        return s

    def transform(self, df_raw: pd.DataFrame) -> pd.DataFrame:
        """Applies data cleansing, schema mapping, deduplication, and timestamp normalization.

        Args:
            df_raw: Raw DataFrame from source table.

        Returns:
            Transformed and validated DataFrame ready for BigQuery loading.
        """
        if df_raw is None or df_raw.empty:
            logger.warning("Input DataFrame is empty. Skipping transformation.")
            return pd.DataFrame(columns=["id", "cleaned_payload", "created_at", "updated_at", "etl_ingested_at"])

        raw_count = len(df_raw)
        logger.info("Transforming %d raw records...", raw_count)

        # 1. Standardize column names to lowercase snake_case
        df = df_raw.copy()
        df.columns = [
            re.sub(r"[^a-zA-Z0-9_]+", "_", str(c).strip().lower()).strip("_")
            for c in df.columns
        ]

        # 2. Map payload column
        if "data_payload" in df.columns and "cleaned_payload" not in df.columns:
            df["cleaned_payload"] = df["data_payload"]
        elif "payload" in df.columns and "cleaned_payload" not in df.columns:
            df["cleaned_payload"] = df["payload"]

        # Ensure required columns exist in working DataFrame
        for col in ["id", "cleaned_payload", "created_at", "updated_at"]:
            if col not in df.columns:
                df[col] = None

        # 3. Clean string values (whitespace trimming and null standardization)
        df["id"] = df["id"].apply(self.clean_text)
        df["cleaned_payload"] = df["cleaned_payload"].apply(self.clean_text)

        # 4. Standardize timestamps to UTC
        for ts_col in ["created_at", "updated_at"]:
            if ts_col in df.columns:
                df[ts_col] = pd.to_datetime(df[ts_col], errors="coerce", utc=True)

        # 5. Drop records where primary key 'id' is null or all fields are null
        df = df.dropna(subset=["id"])
        
        # 6. Deduplication: sort by updated_at / created_at and keep latest per id
        sort_cols = [c for c in ["updated_at", "created_at"] if c in df.columns]
        if sort_cols:
            df = df.sort_values(by=sort_cols, ascending=True)
        df = df.drop_duplicates(subset=["id"], keep="last")

        # 7. Add ingestion audit timestamp
        df["etl_ingested_at"] = pd.Timestamp.now(tz="UTC")

        # Select target schema columns
        target_cols = ["id", "cleaned_payload", "created_at", "updated_at", "etl_ingested_at"]
        df_target = df[target_cols].reset_index(drop=True)

        cleaned_count = len(df_target)
        quarantined = raw_count - cleaned_count
        logger.info(
            "Transformation complete: raw=%d, cleaned=%d, dropped/quarantined=%d",
            raw_count,
            cleaned_count,
            quarantined,
        )

        # Circuit breaker check
        if raw_count > 0 and cleaned_count == 0:
            raise RuntimeError(
                f"Circuit breaker triggered: 100% of raw records ({raw_count}) were dropped."
            )

        return df_target
