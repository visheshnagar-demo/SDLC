"""Data models and schemas for the Sales Order ETL pipeline."""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional


@dataclass
class SalesOrderRecord:
    """Cleaned and validated sales order record destined for BigQuery."""

    order_id: str
    customer_id: str
    product_id: str
    product_category: Optional[str]
    quantity: int
    unit_price: Decimal
    total_amount: Decimal
    order_status: str
    created_at: datetime
    ingested_at: datetime
    batch_id: str

    def __post_init__(self):
        # Validate order_id, customer_id, product_id
        if not self.order_id or not str(self.order_id).strip():
            raise ValueError("order_id cannot be empty")
        self.order_id = str(self.order_id).strip()

        if not self.customer_id or not str(self.customer_id).strip():
            raise ValueError("customer_id cannot be empty")
        self.customer_id = str(self.customer_id).strip()

        if not self.product_id or not str(self.product_id).strip():
            raise ValueError("product_id cannot be empty")
        self.product_id = str(self.product_id).strip()

        if self.product_category is not None:
            cat_str = str(self.product_category).strip()
            self.product_category = cat_str if cat_str else None

        if self.quantity <= 0:
            raise ValueError(f"Quantity must be positive (> 0), got {self.quantity}")

        if self.unit_price < Decimal("0.00"):
            raise ValueError(f"Unit price must be non-negative, got {self.unit_price}")

        if self.total_amount < Decimal("0.00"):
            raise ValueError(f"Total amount must be non-negative, got {self.total_amount}")

        if not self.order_status or not str(self.order_status).strip():
            raise ValueError("order_status cannot be empty")
        self.order_status = str(self.order_status).strip().upper()


@dataclass
class ETLBatchMetrics:
    """Execution telemetry and data quality counters for a batch run."""

    batch_id: str
    raw_records: int = 0
    quarantined_records: int = 0
    deduplicated_records: int = 0
    clean_records_to_load: int = 0
