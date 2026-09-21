"""Dynamic schema discovery and header sanitization engine."""
import re
import logging
from typing import Dict, List
import pandas as pd

logger = logging.getLogger(__name__)


class SchemaEngine:
    """Handles schema discovery, sanitization of column headers, and mapping rules."""

    @staticmethod
    def sanitize_column_name(col_name: str) -> str:
        """Sanitizes raw header strings into valid, clean BigQuery column names.
        
        Example:
            'Actual\\xa0gross' -> 'actual_gross'
            'Adjusted gross (in 2022 dollars)' -> 'adjusted_gross_in_2022_dollars'
            'Year(s)' -> 'years'
            'Ref.' -> 'ref'
        """
        # Replace brackets/parentheses content if needed or remove them
        cleaned = str(col_name).strip()
        cleaned = cleaned.replace("Year(s)", "years").replace("Ref.", "ref")
        cleaned = re.sub(r"[\(\)]", "", cleaned)
        cleaned = re.sub(r"[^a-zA-Z0-9_]+", "_", cleaned.lower())
        cleaned = cleaned.strip("_")
        return cleaned

    @classmethod
    def sanitize_headers(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Renames all columns in DataFrame using sanitized names."""
        mapping: Dict[str, str] = {col: cls.sanitize_column_name(col) for col in df.columns}
        logger.info("Sanitizing columns mapping: %s", mapping)
        return df.rename(columns=mapping)

    @staticmethod
    def get_column_type_map() -> Dict[str, str]:
        """Returns the expected standard BigQuery data types for known target columns."""
        return {
            "rank": "INTEGER",
            "peak": "INTEGER",
            "all_time_peak": "INTEGER",
            "actual_gross": "INTEGER",
            "adjusted_gross_in_2022_dollars": "INTEGER",
            "artist": "STRING",
            "tour_title": "STRING",
            "years": "STRING",
            "shows": "INTEGER",
            "average_gross": "INTEGER",
            "ref": "STRING",
            "_ingested_at": "TIMESTAMP",
            "_source_file": "STRING",
            "_pipeline_version": "STRING",
        }
