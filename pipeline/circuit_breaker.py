"""Circuit breaker and quarantine management for ETL pipeline."""

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """Monitors error and quarantine rates during ETL transformation and halts execution if thresholds are breached."""

    def __init__(
        self,
        max_error_rate: float = 0.05,
        max_quarantine_rows: int = 1000,
    ) -> None:
        self.max_error_rate = max_error_rate
        self.max_quarantine_rows = max_quarantine_rows
        self.rows_extracted: int = 0
        self.rows_cleaned: int = 0
        self.rows_quarantined: int = 0
        self.quarantine_log: List[Dict[str, Any]] = []

    def set_total_extracted(self, count: int) -> None:
        """Sets the total count of extracted rows."""
        self.rows_extracted = count

    def record_success(self) -> None:
        """Records a successfully transformed row."""
        self.rows_cleaned += 1

    def record_quarantine(
        self,
        row_index: int,
        raw_record: Dict[str, Any],
        reason: str,
    ) -> None:
        """Records a quarantined/malformed row and verifies circuit breaker limits."""
        self.rows_quarantined += 1
        entry = {
            "row_index": row_index,
            "reason": reason,
            "raw_record": raw_record,
        }
        self.quarantine_log.append(entry)
        logger.warning(
            "Row %d quarantined: %s | Record: %s",
            row_index,
            reason,
            raw_record,
        )

        if self.rows_quarantined > self.max_quarantine_rows:
            raise RuntimeError(
                f"Circuit breaker tripped: quarantined rows ({self.rows_quarantined}) "
                f"exceeded maximum allowed limit ({self.max_quarantine_rows})."
            )

    def verify_error_rate(self) -> None:
        """Verifies if the total quarantine rate is within the threshold."""
        total = self.rows_extracted or (self.rows_cleaned + self.rows_quarantined)
        if total == 0:
            return

        error_rate = self.rows_quarantined / float(total)
        if error_rate > self.max_error_rate:
            raise RuntimeError(
                f"Circuit breaker tripped: error rate {error_rate:.2%} exceeded "
                f"maximum threshold {self.max_error_rate:.2%} "
                f"({self.rows_quarantined} quarantined / {total} total)."
            )

    def get_summary(self, status: str = "SUCCESS") -> Dict[str, Any]:
        """Returns structured summary report."""
        return {
            "status": status,
            "rows_extracted": self.rows_extracted,
            "rows_cleaned": self.rows_cleaned,
            "rows_quarantined": self.rows_quarantined,
            "quarantine_log_sample": self.quarantine_log[:10],
        }
