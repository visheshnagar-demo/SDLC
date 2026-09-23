"""Schema validation and Fail-Fast Circuit Breaker for Sales Order ETL."""
import re
from typing import List, Optional, Tuple

try:
    import pandas as pd
except ImportError:
    from unittest.mock import MagicMock
    pd = MagicMock()

from server.config import config
from server.logger import logger


def normalize_headers(df: "pd.DataFrame") -> "pd.DataFrame":
    """Converts arbitrary column names to clean, consistent snake_case identifiers."""
    normalized = df.copy()
    normalized.columns = [
        re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
        for col in normalized.columns
    ]
    return normalized


def normalize_column_names(df: "pd.DataFrame") -> "pd.DataFrame":
    """Alias for normalize_headers."""
    return normalize_headers(df)


class SchemaValidator:
    """Validates dynamic schemas on read and trips circuit breakers on anomaly thresholds."""

    REQUIRED_COLUMNS: List[str] = ["order_id", "customer_id", "created_at"]

    def __init__(
        self,
        error_threshold: Optional[float] = None,
        required_columns: Optional[List[str]] = None,
    ):
        self.error_threshold = (
            error_threshold
            if error_threshold is not None
            else config.circuit_breaker_error_threshold
        )
        self.required_columns = required_columns or list(self.REQUIRED_COLUMNS)

    @staticmethod
    def normalize_headers(df: "pd.DataFrame") -> "pd.DataFrame":
        """Converts arbitrary column names to clean, consistent snake_case identifiers."""
        return normalize_headers(df)

    @staticmethod
    def normalize_column_names(df: "pd.DataFrame") -> "pd.DataFrame":
        """Alias for normalize_headers."""
        return normalize_headers(df)

    def check_circuit_breaker(self, total_rows: int, quarantine_count: int) -> bool:
        """Checks if quarantine rate breaches the error threshold."""
        if total_rows == 0:
            return False
        quarantine_rate = quarantine_count / total_rows
        return quarantine_rate > self.error_threshold and quarantine_count > 0

    def validate(self, df: "pd.DataFrame") -> Tuple["pd.DataFrame", "pd.DataFrame"]:
        """Validates incoming dataframe against baseline structural rules.

        Returns:
            Tuple of (valid_df, quarantined_df)
        Raises:
            ValueError: If critical schema violations occur or circuit breaker threshold is breached.
        """
        if df.empty:
            raise ValueError("Input dataframe is empty. Nothing to validate.")

        norm_df = self.normalize_headers(df)
        total_rows = len(norm_df)

        # Check required columns presence
        missing_required = [col for col in self.required_columns if col not in norm_df.columns]
        if missing_required:
            raise ValueError(
                f"Schema contract violation: missing mandatory columns {missing_required}. "
                f"Discovered columns: {list(norm_df.columns)}"
            )

        # Mark invalid rows (e.g., missing critical IDs or dates)
        is_order_id_valid = (
            norm_df["order_id"].notna()
            & (norm_df["order_id"].astype(str).str.strip() != "")
            & (norm_df["order_id"].astype(str).str.strip().str.lower() != "nan")
            & (norm_df["order_id"].astype(str).str.strip().str.lower() != "none")
        )
        is_customer_id_valid = (
            norm_df["customer_id"].notna()
            & (norm_df["customer_id"].astype(str).str.strip() != "")
            & (norm_df["customer_id"].astype(str).str.strip().str.lower() != "nan")
            & (norm_df["customer_id"].astype(str).str.strip().str.lower() != "none")
        )
        is_created_at_valid = (
            norm_df["created_at"].notna()
            & (norm_df["created_at"].astype(str).str.strip() != "")
            & (norm_df["created_at"].astype(str).str.strip().str.lower() != "nan")
            & (norm_df["created_at"].astype(str).str.strip().str.lower() != "none")
        )

        valid_mask = is_order_id_valid & is_customer_id_valid & is_created_at_valid

        valid_df = norm_df[valid_mask].copy()
        quarantined_df = norm_df[~valid_mask].copy()

        quarantine_count = len(quarantined_df)
        quarantine_rate = quarantine_count / total_rows

        logger.info(
            "Validation result: total=%d, valid=%d, quarantined=%d (rate=%.2f%%)",
            total_rows,
            len(valid_df),
            quarantine_count,
            quarantine_rate * 100,
        )

        # Circuit breaker trigger
        if self.check_circuit_breaker(total_rows, quarantine_count):
            raise ValueError(
                f"Circuit breaker tripped: Quarantine rate {quarantine_rate:.2%} exceeded threshold "
                f"{self.error_threshold:.2%}. {quarantine_count} of {total_rows} rows corrupted."
            )

        if len(valid_df) == 0:
            raise ValueError("All rows were quarantined during validation. Terminating execution.")

        return valid_df, quarantined_df

    def validate_schema(self, df: "pd.DataFrame") -> Tuple["pd.DataFrame", "pd.DataFrame"]:
        """Alias for validate."""
        return self.validate(df)

    def validate_records(self, df: "pd.DataFrame") -> Tuple["pd.DataFrame", "pd.DataFrame"]:
        """Alias for validate."""
        return self.validate(df)


def validate_schema(
    df: "pd.DataFrame", error_threshold: float = 0.20
) -> Tuple["pd.DataFrame", "pd.DataFrame"]:
    """Helper function to validate dataframe schema."""
    validator = SchemaValidator(error_threshold=error_threshold)
    return validator.validate(df)


def validate_data(
    df: "pd.DataFrame", error_threshold: float = 0.20
) -> Tuple["pd.DataFrame", "pd.DataFrame"]:
    """Helper function to validate dataframe data."""
    return validate_schema(df, error_threshold=error_threshold)
