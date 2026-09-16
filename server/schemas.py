from typing import Any, Optional, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date


class PipelineMetrics(BaseModel):
    extracted_count: int = 0
    filtered_missing_amount: int = 0
    filtered_invalid_email: int = 0
    total_filtered: int = 0
    loaded_count: int = 0


class PipelineRunRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    batch_size: int = Field(default=1000, ge=1, le=50000)
    force_reload: bool = False


class PipelineRunResponse(BaseModel):
    status: str
    job_id: str
    start_time: str
    end_time: str
    duration_seconds: float
    metrics: PipelineMetrics


class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    bigquery_accessible: bool


class RawSalesOrderCreate(BaseModel):
    order_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_email: Optional[str] = None
    order_date: date
    amount: Optional[float] = None
    currency: Optional[str] = "USD"
    status: Optional[str] = "completed"


class RawSalesOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    customer_id: Optional[str] = None
    customer_email: Optional[str] = None
    order_date: date
    amount: Optional[float] = None
    currency: Optional[str] = "USD"
    status: Optional[str] = "completed"
    created_at: datetime


class FctSalesOrder(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    customer_email: str
    order_date: str
    amount: float
    currency: Optional[str] = "USD"
    status: Optional[str] = "completed"
    source_created_at: Optional[str] = None
    ingested_at: str


class CartItem(BaseModel):
    name: str
    quantity: int = 1
    unit_price: float


class CheckoutSessionRequest(BaseModel):
    amount: float = Field(gt=0, description="Amount in base currency")
    currency: str = Field(default="USD", description="Settlement/target currency")
    customer_email: str
    items: Optional[List[CartItem]] = Field(default_factory=list)


class CheckoutSessionResponse(BaseModel):
    session_id: str
    payment_intent_id: str
    client_secret: str
    base_amount: float
    base_currency: str
    target_amount: float
    target_currency: str
    exchange_rate: float


class DigitalWalletPaymentRequest(BaseModel):
    wallet_type: str = Field(description="apple_pay or google_pay")
    payment_token: str
    currency: str = "USD"
    amount: float = Field(gt=0)
    customer_email: Optional[str] = "customer@example.com"


class DigitalWalletPaymentResponse(BaseModel):
    transaction_id: str
    payment_intent_id: str
    wallet_type: str
    amount: float
    currency: str
    status: str


class ExchangeRatesResponse(BaseModel):
    base_currency: str
    rates: dict[str, float]
    timestamp: str


class RefundRequest(BaseModel):
    transaction_id: str
    amount: float = Field(gt=0)
    reason: str
    memo: Optional[str] = None


class RefundSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: str
    refund_amount: float
    currency: str
    reason: str
    memo: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None


class TransactionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: str
    customer_email: str
    payment_method: str
    amount: float
    currency: str
    status: str
    created_at: Optional[datetime] = None


class TransactionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: str
    customer_email: str
    payment_method: str
    amount: float
    base_currency: str
    target_currency: str
    converted_amount: float
    exchange_rate: float
    status: str
    refunded_amount: float
    remaining_refundable_balance: float
    refunds: List[RefundSummary] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: Optional[str] = None
    event_type: str
    ip_address: str
    masked_payload: dict[str, Any]
    created_at: Optional[datetime] = None
