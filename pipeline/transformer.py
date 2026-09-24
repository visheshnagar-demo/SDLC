"""Transformation module for cleaning and validating extracted PostgreSQL records."""

import logging
from datetime import datetime, timezone
from typing import Dict, Tuple
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

NULL_EQUIVALENTS = {"", "n/a", "null", "none", "nan", "nil", "undefined"}


class DataTransformer:
    """Transforms raw PostgreSQL records into cleaned records matching BigQuery schema."""

    def __init__(self, error_threshold_ratio: float = 0.05):
        self.error_threshold_ratio = error_threshold_ratio

    def clean_string_column(self, series: pd.Series) -> pd.Series:
        """Strip whitespace and convert placeholder null strings to pd.NA."""
        def _clean_val(val):
            if pd.isna(val):
                return pd.NA
            s = str(val).strip()
            if s.lower() in NULL_EQUIVALENTS:
                return pd.NA
            return s

        return series.map(_clean_val)

    def clean_email_column(self, series: pd.Series) -> pd.Series:
        """Strip, lowercase, and null-normalize email strings."""
        def _clean_email(val):
            if pd.isna(val):
                return pd.NA
            s = str(val).strip().lower()
            if s in NULL_EQUIVALENTS:
                return pd.NA
            return s

        return series.map(_clean_email)

    def clean_numeric_column(self, series: pd.Series) -> pd.Series:
        """Cast numeric columns to numeric/Int64 with coercion."""
        cleaned_str = self.clean_string_column(series)
        return pd.to_numeric(cleaned_str, errors="coerce").astype("Int64")

    def clean_timestamp_column(self, series: pd.Series) -> pd.Series:
        """Parse timestamps into UTC datetime."""
        cleaned_str = self.clean_string_column(series)
        return pd.to_datetime(cleaned_str, errors="coerce", utc=True)

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, any]]:
        """Clean and validate DataFrame against schema contract with circuit breakers."""
        source_count = len(df)
        logger.info(f"Transforming {source_count} raw rows...")

        if df.empty:
            empty_df = pd.DataFrame(
                columns=["id", "name", "age", "email", "created_at", "_extracted_at"]
            )
            empty_df["_extracted_at"] = pd.to_datetime(empty_df["_extracted_at"], utc=True)
            metrics = {
                "source_row_count": 0,
                "cleaned_row_count": 0,
                "dropped_row_count": 0,
                "error_rate": 0.0,
            }
            return empty_df, metrics

        cleaned_df = df.copy()

        # 1. Clean string columns
        if "id" in cleaned_df.columns:
            cleaned_df["id"] = self.clean_string_column(cleaned_df["id"])
        else:
            raise ValueError("Required column 'id' missing from source dataset.")

        if "name" in cleaned_df.columns:
            cleaned_df["name"] = self.clean_string_column(cleaned_df["name"])

        if "email" in cleaned_df.columns:
            cleaned_df["email"] = self.clean_email_column(cleaned_df["email"])

        # 2. Clean numeric columns
        if "age" in cleaned_df.columns:
            cleaned_df["age"] = self.clean_numeric_column(cleaned_df["age"])

        # 3. Clean timestamp columns
        if "created_at" in cleaned_df.columns:
            cleaned_df["created_at"] = self.clean_timestamp_column(cleaned_df["created_at"])

        # 4. Filter invalid rows where required id is null
        invalid_rows = cleaned_df["id"].isna()
        error_count = int(invalid_rows.sum())
        error_rate = error_count / source_count if source_count > 0 else 0.0

        if error_rate > self.error_threshold_ratio:
            raise RuntimeError(
                f"Circuit breaker triggered: malformed records error rate ({error_rate:.2%}) "
                f"exceeds allowed threshold ({self.error_threshold_ratio:.2%})."
            )

        cleaned_df = cleaned_df[~invalid_rows].copy()

        # 5. Deduplicate
        cleaned_df = cleaned_df.drop_duplicates(subset=["id"], keep="last")

        # 6. Add _extracted_at audit column
        now_utc = datetime.now(timezone.utc)
        cleaned_df["_extracted_at"] = now_utc

        # Ensure correct column order
        expected_cols = ["id", "name", "age", "email", "created_at", "_extracted_at"]
        for col in expected_cols:
            if col not in cleaned_df.columns:
                cleaned_df[col] = pd.NA

        cleaned_df = cleaned_df[expected_cols]

        cleaned_count = len(cleaned_df)
        dropped_count = source_count - cleaned_count

        metrics = {
            "source_row_count": source_count,
            "cleaned_row_count": cleaned_count,
            "dropped_row_count": dropped_count,
            "error_rate": error_rate,
        }
        logger.info(
            f"Transformation completed: {cleaned_count} rows retained, {dropped_count} rows dropped."
        )
        return cleaned_df, metrics
