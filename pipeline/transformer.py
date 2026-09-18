"""Data Transformation Module for sanitizing and type-casting raw CSV records."""
import re
import logging
from datetime import datetime, timezone

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)

FOOTNOTE_RE = re.compile(r"\[[^\]]*\]")
NUMERIC_CLEAN_RE = re.compile(r"[,$€£¥\s\u00a0†‡]")


class DataTransformer:
    """Transforms, sanitizes, and type-casts raw records for BigQuery loading."""

    @staticmethod
    def clean_column_names(df):
        """Sanitize column headers to valid BigQuery identifier format: lowercase, alphanumeric + underscores."""
        new_cols = []
        for col in df.columns:
            sanitized = re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
            new_cols.append(sanitized)
        df.columns = new_cols
        return df

    @staticmethod
    def clean_numeric_value(val):
        """Cleans footnote notations, currency symbols, and commas, returning integer or None."""
        if val is None:
            return None
        if pd is not None and pd.isna(val):
            return None
        val_str = str(val).strip()
        if not val_str or val_str.lower() in ("nan", "none", "null", ""):
            return None
        val_str = FOOTNOTE_RE.sub("", val_str)
        val_str = NUMERIC_CLEAN_RE.sub("", val_str)
        if not val_str:
            return None
        try:
            return int(round(float(val_str)))
        except (ValueError, TypeError):
            logger.warning("Could not parse numeric value: '%s'", val)
            return None

    @staticmethod
    def clean_string_value(val):
        """Cleans whitespace and null placeholders from string values."""
        if val is None:
            return None
        if pd is not None and pd.isna(val):
            return None
        val_str = str(val).strip()
        if not val_str or val_str.lower() in ("nan", "none", "null"):
            return None
        return val_str

    def transform(self, df, source_file: str = "gs://sdlc-workspec-store/etl/data/my_file (1).csv"):
        """Performs end-to-end transformation on the extracted DataFrame."""
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for pipeline execution.")
        if df.empty:
            logger.warning("Input DataFrame is empty. Skipping transformation.")
            return df

        df = df.copy()
        raw_count = len(df)
        logger.info("Transforming %d raw records. Raw columns: %s", raw_count, list(df.columns))

        # 1. Clean column names
        df = self.clean_column_names(df)
        logger.info("Normalized columns: %s", list(df.columns))

        # 2. Transform known numeric columns
        numeric_col_candidates = [
            "rank", "peak", "all_time_peak", "actual_gross",
            "adjusted_gross_in_2022_dollars", "adjusted_gross_2022",
            "shows", "average_gross"
        ]
        for col in numeric_col_candidates:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_numeric_value)
                df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
                logger.info("Cleaned and coerced numeric column '%s'", col)

        # 3. Clean string columns
        for col in df.select_dtypes(include=["object"]).columns:
            df[col] = df[col].apply(self.clean_string_value)

        # 4. Add ingestion audit metadata
        df["ingested_at"] = datetime.now(timezone.utc)
        df["_source_file"] = source_file

        logger.info("Transformation finished successfully. Total records: %d", len(df))
        return df
