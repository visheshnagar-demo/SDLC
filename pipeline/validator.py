"""Data validation and circuit breaker module for raw sales orders."""
from typing import List, Tuple
import pandas as pd
from pipeline.logger import get_logger

logger = get_logger("validator")

REQUIRED_COLUMNS = [
    "order_id",
    "customer_id",
    "customer_name",
    "currency",
    "order_status",
    "created_at",
]


class DataValidator:
    """Validates structural and schema integrity on ingested records."""

    def __init__(self, required_columns: List[str] = None):
        self.required_columns = required_columns or REQUIRED_COLUMNS

    def validate_schema(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validates that all required columns are present in the DataFrame."""
        if df.empty:
            return False, ["DataFrame is completely empty (0 rows)."]

        missing_cols = [col for col in self.required_columns if col not in df.columns]
        if missing_cols:
            return False, [f"Missing required column: {col}" for col in missing_cols]

        return True, []

    def validate_and_filter(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies schema checks, removes completely blank rows, and applies circuit breaker."""
        valid, errors = self.validate_schema(df)
        if not valid:
            error_msg = f"Schema validation failed: {'; '.join(errors)}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        initial_count = len(df)
        # Drop rows where all columns or critical key columns are missing
        df_clean = df.dropna(subset=["order_id", "customer_id"], how="any")
        dropped_count = initial_count - len(df_clean)

        if dropped_count > 0:
            logger.warning(
                f"Quarantined {dropped_count} rows with missing essential identifiers (order_id/customer_id)."
            )

        if len(df_clean) == 0 and initial_count > 0:
            raise ValueError(
                "FATAL: 100% of rows failed validation. Circuit breaker triggered."
            )

        logger.info(f"Validation successful. {len(df_clean)} of {initial_count} rows passed.")
        return df_clean
