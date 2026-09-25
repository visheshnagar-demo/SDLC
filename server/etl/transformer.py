"""Data Cleaning and Transformation Engine."""
import logging
import re
from datetime import datetime, timezone
import pandas as pd
from server.etl.config import ETLConfig

logger = logging.getLogger("server.etl.transformer")


class DataTransformer:
    """Transforms raw PostgreSQL records into clean, validated data ready for BigQuery."""

    def __init__(self, config: ETLConfig):
        self.config = config

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies data sanitization, type coercion, deduplication, and metadata enrichment."""
        if df is None or df.empty:
            logger.warning("Empty DataFrame provided to transformer.")
            return pd.DataFrame()

        raw_count = len(df)
        logger.info("Transforming %d raw records...", raw_count)

        # 1. Standardize column names
        df_clean = df.copy()
        df_clean.columns = [
            re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
            for col in df_clean.columns
        ]

        # 2. String sanitization & null standardization
        null_literals = {"", "null", "none", "n/a", "nan", "nil", "undefined"}
        for col in df_clean.select_dtypes(include=["object", "string"]).columns:
            # Strip whitespace safely
            df_clean[col] = df_clean[col].apply(
                lambda val: str(val).strip() if pd.notna(val) else None
            )
            # Standardize null strings
            df_clean[col] = df_clean[col].apply(
                lambda val: None if (val is None or str(val).lower() in null_literals) else val
            )

        # 3. Deduplicate rows across all existing data columns
        df_clean = df_clean.drop_duplicates()

        # 4. Standardize timestamp columns
        for col in df_clean.columns:
            if "date" in col or "time" in col or col in ("created_at", "updated_at"):
                df_clean[col] = pd.to_datetime(df_clean[col], errors="coerce", utc=True)

        # 5. Drop rows where all non-metadata columns are entirely null
        df_valid = df_clean.dropna(how="all").copy()

        # 6. Circuit breaker
        if raw_count > 0 and len(df_valid) == 0:
            raise RuntimeError(
                f"Circuit breaker triggered: 100% of {raw_count} raw records were invalid or null."
            )

        # 7. Metadata enrichment
        ingest_time = datetime.now(timezone.utc)
        df_valid["_etl_loaded_at"] = ingest_time
        df_valid["_etl_source_table"] = f"{self.config.postgres_db}.{self.config.postgres_table}"

        logger.info(
            "Transformation finished. Input rows: %d, Output rows: %d (Dropped: %d)",
            raw_count,
            len(df_valid),
            raw_count - len(df_valid),
        )
        return df_valid
