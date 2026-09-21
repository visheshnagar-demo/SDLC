"""Circuit Breaker and Row Count Reconciler for data pipeline resilience."""
import logging
import pandas as pd
from server.pipeline.config import PipelineConfig

logger = logging.getLogger(__name__)


class CircuitBreakerError(Exception):
    """Raised when data quality thresholds are violated."""
    pass


class CircuitBreaker:
    def __init__(self, config: PipelineConfig):
        self.config = config

    def validate(self, raw_count: int, df_transformed: pd.DataFrame) -> pd.DataFrame:
        """Validates transformed data against quality thresholds and filters invalid rows.
        
        Raises CircuitBreakerError if corruption rate exceeds max_error_threshold_pct.
        """
        if raw_count == 0:
            logger.warning("Zero raw records received; circuit breaker bypassed for empty source.")
            return df_transformed

        # Check for completely null rows
        content_cols = [c for c in df_transformed.columns if not c.startswith("_")]
        valid_df = df_transformed.dropna(subset=content_cols, how="all")
        corrupted_count = raw_count - len(valid_df)
        error_rate = corrupted_count / raw_count if raw_count > 0 else 0.0

        logger.info(
            "Circuit Breaker Check: raw=%d, valid=%d, corrupted=%d, error_rate=%.2f%% (threshold=%.2f%%)",
            raw_count,
            len(valid_df),
            corrupted_count,
            error_rate * 100,
            self.config.max_error_threshold_pct * 100,
        )

        if error_rate > self.config.max_error_threshold_pct:
            raise CircuitBreakerError(
                f"Circuit breaker tripped: error rate {error_rate:.2%} exceeded max allowed "
                f"threshold {self.config.max_error_threshold_pct:.2%}. Raw records: {raw_count}, Corrupted: {corrupted_count}"
            )

        return valid_df
