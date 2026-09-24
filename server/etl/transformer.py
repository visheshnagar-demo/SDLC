"""Data Transformer Module for cleaning, type coercion, and sorting by rank."""
import logging
import re
from datetime import datetime, timezone
import pandas as pd

logger = logging.getLogger("etl.transformer")

_FOOTNOTE_RE = re.compile(r"\[[^\]]*\]")
_NUMERIC_STRIP_RE = re.compile(r"[,$€£¥\s\u00a0\u2020\u2021]")


class TourDataTransformer:
    def __init__(self, source_file_uri: str = "gs://sdlc-workspec-store/etl/data/my_file (1).csv"):
        self.source_file_uri = source_file_uri

    @staticmethod
    def _clean_numeric(series: pd.Series) -> pd.Series:
        """Strips footnotes, currency symbols, and whitespace before numeric casting."""
        cleaned = (
            series.astype(str)
            .str.replace(_FOOTNOTE_RE, "", regex=True)
            .str.replace(_NUMERIC_STRIP_RE, "", regex=True)
            .str.strip()
        )
        return pd.to_numeric(cleaned, errors="coerce").astype("Int64")

    @staticmethod
    def _clean_string(series: pd.Series) -> pd.Series:
        """Trims whitespace and converts string 'nan' / empty to None."""
        return (
            series.astype(str)
            .str.strip()
            .replace({"nan": None, "None": None, "<NA>": None, "": None})
        )

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies data cleansing, schema mapping, column standardization, and sorting."""
        logger.info("Transforming raw DataFrame with %d rows and columns: %s", len(df), list(df.columns))
        df_out = pd.DataFrame()

        # Map source column names flexibly (case & space agnostic)
        col_map = {}
        for col in df.columns:
            normalized_key = re.sub(r"[^a-zA-Z0-9]+", "", str(col).lower())
            col_map[normalized_key] = col

        # Helper to get source series
        def get_series(keys):
            for k in keys:
                norm_k = re.sub(r"[^a-zA-Z0-9]+", "", k.lower())
                if norm_k in col_map:
                    return df[col_map[norm_k]]
            return pd.Series([None] * len(df))

        # 1. Rank
        df_out["Rank"] = self._clean_numeric(get_series(["Rank", "rank"]))

        # 2. Peak
        df_out["Peak"] = self._clean_numeric(get_series(["Peak", "peak"]))

        # 3. All_Time_Peak
        df_out["All_Time_Peak"] = self._clean_numeric(get_series(["All Time Peak", "All_Time_Peak", "alltimepeak"]))

        # 4. Actual_gross
        df_out["Actual_gross"] = self._clean_numeric(get_series(["Actual gross", "Actual\xa0gross", "actual_gross", "actualgross"]))

        # 5. Adjusted_gross_2022_dollars
        df_out["Adjusted_gross_2022_dollars"] = self._clean_numeric(
            get_series(["Adjusted gross (in 2022 dollars)", "Adjusted\xa0gross (in 2022 dollars)", "adjusted_gross_2022_dollars", "adjustedgross"])
        )

        # 6. Artist
        df_out["Artist"] = self._clean_string(get_series(["Artist", "artist"]))

        # 7. Tour_title
        df_out["Tour_title"] = self._clean_string(get_series(["Tour title", "Tour_title", "tourtitle"]))

        # 8. Years
        df_out["Years"] = self._clean_string(get_series(["Year(s)", "Years", "years", "year"]))

        # 9. Shows
        df_out["Shows"] = self._clean_numeric(get_series(["Shows", "shows"]))

        # 10. Average_gross
        df_out["Average_gross"] = self._clean_numeric(get_series(["Average gross", "Average_gross", "averagegross"]))

        # 11. Ref
        df_out["Ref"] = self._clean_string(get_series(["Ref.", "Ref", "ref"]))

        # 12. Lineage and Audit fields
        now_utc = datetime.now(timezone.utc).isoformat()
        df_out["_etl_loaded_at"] = now_utc
        df_out["_source_file"] = self.source_file_uri

        # 13. Deterministic Sorting: ORDER BY Rank ASC (nulls last)
        df_out = df_out.sort_values(by=["Rank"], ascending=[True], na_position="last").reset_index(drop=True)

        logger.info("Transformation finished: %d records sorted by Rank ASC.", len(df_out))
        return df_out
