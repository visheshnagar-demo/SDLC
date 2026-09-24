"""Data Validator & Circuit Breaker Module."""
import logging
import pandas as pd

logger = logging.getLogger("etl.validator")


class DataValidator:
    def __init__(self, required_columns=None):
        self.required_columns = required_columns or ["Rank"]

    def validate_raw(self, df: pd.DataFrame) -> bool:
        """Validates raw extracted DataFrame before transformation.
        Triggers circuit breaker if mandatory constraints are violated.
        """
        if df is None or df.empty:
            raise ValueError("CIRCUIT BREAKER: Extracted DataFrame is empty (0 rows). Halting pipeline.")

        # Normalize column names for flexible matching
        cols_lower = [str(c).strip().lower() for c in df.columns]
        for req in self.required_columns:
            if req.lower() not in cols_lower:
                raise ValueError(
                    f"CIRCUIT BREAKER: Mandatory column '{req}' not found in source dataset. Available: {list(df.columns)}"
                )

        logger.info("Raw validation PASSED: %d rows, %d columns verified.", len(df), len(df.columns))
        return True

    def validate_transformed(self, df: pd.DataFrame) -> bool:
        """Validates transformed DataFrame before loading to warehouse."""
        if df is None or df.empty:
            raise ValueError("CIRCUIT BREAKER: Transformed DataFrame is empty. No valid records survived transformation.")

        if "Rank" not in df.columns:
            raise ValueError("CIRCUIT BREAKER: Target column 'Rank' is missing after transformation.")

        null_ranks = df["Rank"].isna().sum()
        if null_ranks > 0:
            logger.warning("Found %d rows with null Rank values after coercion.", null_ranks)

        logger.info("Transformed validation PASSED: %d rows ready for BigQuery load.", len(df))
        return True
