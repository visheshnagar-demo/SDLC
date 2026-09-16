"""Sales Order data models and schema definitions."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SalesOrderRaw(BaseModel):
    """Raw Sales Order schema before validation/cleansing."""
    order_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    product_category: Optional[str] = None
    amount: float
    currency: str
    order_status: str
    created_at: str


class SalesOrder(BaseModel):
    """Cleaned and standardized Sales Order for BigQuery warehouse ingestion."""
    order_id: str = Field(..., description="Natural primary key of the sales order")
    customer_id: str = Field(..., description="Customer identifier")
    customer_name: Optional[str] = Field(None, description="Customer full name")
    customer_email: Optional[str] = Field(None, description="Customer email address")
    product_category: Optional[str] = Field(None, description="Product category / classification")
    amount: float = Field(..., ge=0.0, description="Cleansed monetary value")
    currency: str = Field(..., description="ISO Currency Code")
    order_status: str = Field(..., description="Order processing status")
    created_at: datetime = Field(..., description="Order creation timestamp (UTC)")
    ingested_at: datetime = Field(..., description="ETL ingestion audit timestamp (UTC)")


BIGQUERY_SALES_ORDERS_SCHEMA = [
    {"name": "order_id", "type": "STRING", "mode": "REQUIRED", "description": "Natural primary key of the sales order"},
    {"name": "customer_id", "type": "STRING", "mode": "REQUIRED", "description": "Customer identifier"},
    {"name": "customer_name", "type": "STRING", "mode": "NULLABLE", "description": "Customer full name"},
    {"name": "customer_email", "type": "STRING", "mode": "NULLABLE", "description": "Customer email address"},
    {"name": "product_category", "type": "STRING", "mode": "NULLABLE", "description": "Product category / classification"},
    {"name": "amount", "type": "FLOAT64", "mode": "REQUIRED", "description": "Cleansed monetary value"},
    {"name": "currency", "type": "STRING", "mode": "REQUIRED", "description": "ISO Currency Code"},
    {"name": "order_status", "type": "STRING", "mode": "REQUIRED", "description": "Order processing status"},
    {"name": "created_at", "type": "TIMESTAMP", "mode": "REQUIRED", "description": "Order creation timestamp (UTC)"},
    {"name": "ingested_at", "type": "TIMESTAMP", "mode": "REQUIRED", "description": "ETL ingestion audit timestamp (UTC)"},
]
