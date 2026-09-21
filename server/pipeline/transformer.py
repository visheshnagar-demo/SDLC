"""Transformation and data cleansing engine."""
import re
import logging
from datetime import datetime, timezone
from typing import Optional
import pandas as pd
from server.pipeline.config import PipelineConfig
from server.pipeline.schema_engine import SchemaEngine

logger = logging.getLogger(__name__)

FOOTNOTE_PATTERN = re.compile(r"\[[^\]]*\]")
NUMERIC_CLEAN_PATTERN = re.compile(r"[\$,€£¥\s\u00a0]")


class DataTransformer:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config

    @staticmethod
    def clean_numeric_string(val) -> Optional[int]:
        """Strips footnotes, currency symbols, and commas, returning integer or None."""
        if val is None or pd.isna(val):
            return None
        s = str(val).strip()
        if not s or s.lower() in ("nan", "none", "null", "-", "n/a", "#n/a"):
            return None
        # Remove footnote citations e.g. [4], [7]
        s = FOOTNOTE_PATTERN.sub("", s)
        # Remove currency symbols, commas, non-breaking spaces
        s = NUMERIC_CLEAN_PATTERN.sub("", s)
        # Clean any remaining symbols e.g. dagger symbols †, ‡
        s = re.sub(r"[^\d\-]", "", s)
        if not s:
            return None
        try:
            return int(s)
        except ValueError:
            return None

    @staticmethod
    def clean_text_string(val) -> Optional[str]:
        """Trims whitespace and converts empty/sentinel strings to None."""
        if val is None or pd.isna(val):
            return None
        s = str(val).strip()
        if not s or s.lower() in ("nan", "none", "null", "n/a", "#n/a"):
            return None
        return s

    def transform(self, df_raw: pd.DataFrame) -> pd.DataFrame:
        """Transforms raw DataFrame into clean, type-coerced analytical format."""
        if df_raw.empty:
            logger.warning("Empty DataFrame provided to transformer.")
            return df_raw.copy()

        # Step 1: Sanitize headers
        df = SchemaEngine.sanitize_headers(df_raw.copy())

        # Step 2: Clean and cast specific columns
        numeric_cols = [
            "rank",
            "peak",
            "all_time_peak",
            "actual_gross",
            "adjusted_gross_in_2022_dollars",
            "shows",
            "average_gross",
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_numeric_string).astype("Int64")

        text_cols = ["artist", "tour_title", "years", "ref"]
        for col in text_cols:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_text_string)

        # Step 3: Add audit metadata columns
        now_utc = datetime.now(timezone.utc).isoformat()
        df["_ingested_at"] = pd.to_datetime(now_utc)
        source_uri = (
            self.config.gcs_source_uri
            if self.config
            else "gs://sdlc-workspec-store/etl/data/my_file (1).csv"
        )
        pipeline_ver = self.config.pipeline_version if self.config else "1.0.0"
        df["_source_file"] = source_uri
        df["_pipeline_version"] = pipeline_ver

        logger.info("Transformed %d records successfully", len(df))
        return df
