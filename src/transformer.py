"""Data transformer and sanitizer module for ETL pipeline."""
import logging
import re
from dataclasses import dataclass
from typing import Dict, Tuple
import numpy as np
import pandas as pd

logger = logging.getLogger("etl_pipeline.transformer")


@dataclass
class TransformationMetrics:
    extracted_count: int
    sanitized_count: int
    duplicates_removed: int
    nulls_sanitized: int


class DataSanitizer:
    """Performs dynamic schema discovery, whitespace trimming, null sanitization, and deduplication."""

    @staticmethod
    def clean(df: pd.DataFrame) -> Tuple[pd.DataFrame, TransformationMetrics]:
        """Cleans and normalizes the input DataFrame."""
        extracted_count = len(df)
        if extracted_count == 0:
            logger.warning("Empty input DataFrame provided for transformation.")
            return df, TransformationMetrics(
                extracted_count=0,
                sanitized_count=0,
                duplicates_removed=0,
                nulls_sanitized=0,
            )

        # Standardize column names
        df_clean = df.copy()
        df_clean.columns = [
            re.sub(r"[^a-zA-Z0-9_]+", "_", str(c).strip().lower()).strip("_")
            for c in df_clean.columns
        ]

        # Calculate initial nulls
        initial_nulls = int(df_clean.isna().sum().sum())

        # Vectorized string trimming and null normalization
        for col in df_clean.select_dtypes(include=["object", "string"]).columns:
            # Strip whitespace
            df_clean[col] = df_clean[col].astype(str).str.strip()
            # Standardize null-like values
            df_clean[col] = df_clean[col].replace({
                "": None,
                "nan": None,
                "NaN": None,
                "None": None,
                "null": None,
                "NULL": None,
                "<NA>": None,
            })

        # Coerce timestamp/date columns if detected
        for col in df_clean.columns:
            col_lower = col.lower()
            if any(t in col_lower for t in ["_at", "timestamp", "date", "time"]):
                df_clean[col] = pd.to_datetime(df_clean[col], errors="coerce", utc=True)

        # Count nulls after replacement
        final_nulls = int(df_clean.isna().sum().sum())
        nulls_sanitized = max(0, final_nulls - initial_nulls)

        # Deduplication
        pre_dedup = len(df_clean)
        df_clean = df_clean.drop_duplicates().reset_index(drop=True)
        duplicates_removed = pre_dedup - len(df_clean)

        # Remove entirely null rows
        df_clean = df_clean.dropna(how="all").reset_index(drop=True)

        sanitized_count = len(df_clean)

        # Circuit breaker: if all non-empty extracted rows are dropped
        if extracted_count > 0 and sanitized_count == 0:
            logger.error("Circuit breaker triggered: 100%% of %d rows failed sanitization.", extracted_count)
            raise RuntimeError(f"Circuit breaker triggered: all {extracted_count} records were dropped during cleaning.")

        metrics = TransformationMetrics(
            extracted_count=extracted_count,
            sanitized_count=sanitized_count,
            duplicates_removed=duplicates_removed,
            nulls_sanitized=nulls_sanitized,
        )

        logger.info(
            "Transformation complete: %d extracted -> %d sanitized (%d duplicates removed, %d nulls sanitized)",
            extracted_count,
            sanitized_count,
            duplicates_removed,
            nulls_sanitized,
        )

        return df_clean, metrics
