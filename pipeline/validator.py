"""Data Validation and Circuit Breaker Module."""
import logging

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)


class DataValidator:
    """Validates records and enforces circuit breaker error limits."""

    def __init__(self, max_error_threshold: float = 0.05):
        self.max_error_threshold = max_error_threshold

    def validate(self, df):
        """Filters empty rows and verifies data quality thresholds.

        Raises:
            RuntimeError: If error rate exceeds max_error_threshold or 100% rows fail.
        """
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for pipeline execution.")
        if df.empty:
            logger.warning("DataFrame is empty before validation.")
            return df

        raw_count = len(df)
        key_cols = [c for c in ["artist", "tour_title", "rank"] if c in df.columns]
        if key_cols:
            valid_mask = df[key_cols].notna().any(axis=1)
        else:
            valid_mask = df.notna().any(axis=1)

        valid_df = df[valid_mask].copy()
        failed_count = raw_count - len(valid_df)
        error_rate = failed_count / raw_count if raw_count > 0 else 0.0

        logger.info(
            "Validation metrics: total=%d, valid=%d, failed=%d, error_rate=%.2f%%",
            raw_count, len(valid_df), failed_count, error_rate * 100
        )

        if len(valid_df) == 0 and raw_count > 0:
            raise RuntimeError(
                f"FATAL: Circuit breaker triggered. 100% of records ({raw_count}) failed validation."
            )

        if error_rate > self.max_error_threshold:
            raise RuntimeError(
                f"FATAL: Error threshold exceeded! Error rate {error_rate:.2%} > allowed {self.max_error_threshold:.2%}."
            )

        return valid_df
