from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date


# --- Existing Schemas (Preserved) ---

class CartItem(BaseModel):
    name: str
    quantity: int = 1
    unit_price: float


class CheckoutSessionRequest(BaseModel):
    amount: float = Field(gt=0, description="Amount in base currency")
    currency: str = Field(default="USD", description="Settlement/target currency")
    customer_email: str
    items: Optional[list[CartItem]] = Field(default_factory=list)


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
    refunds: list[RefundSummary] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: Optional[str] = None
    event_type: str
    ip_address: str
    masked_payload: dict[str, Any]
    created_at: Optional[datetime] = None


# --- Hens Management System Schemas ---

class FlockCreate(BaseModel):
    name: str
    breed: str
    hatch_date: date
    initial_count: int
    coop_location: str


class FlockUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    hatch_date: Optional[date] = None
    coop_location: Optional[str] = None
    status: Optional[str] = None


class FlockStatusUpdate(BaseModel):
    status: str


class FlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    breed: str
    hatch_date: date
    initial_count: int
    active_count: int
    coop_location: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class EggCollectionCreate(BaseModel):
    flock_id: str
    collection_date: date
    session: str
    grade_large: int = 0
    grade_medium: int = 0
    grade_small: int = 0
    damaged: int = 0


class EggCollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    flock_id: str
    collection_date: date
    session: str
    grade_large: int
    grade_medium: int
    grade_small: int
    damaged: int
    total_count: int
    warning: Optional[str] = None
    created_at: Optional[datetime] = None


class FeedInventoryCreate(BaseModel):
    feed_type: str
    quantity_kg: float = 0.0
    reorder_threshold_kg: float = 100.0


class FeedInventoryUpdate(BaseModel):
    quantity_kg: Optional[float] = None
    reorder_threshold_kg: Optional[float] = None


class FeedInventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    feed_type: str
    quantity_kg: float
    reorder_threshold_kg: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FeedLogCreate(BaseModel):
    flock_id: str
    feed_id: str
    quantity_used_kg: float
    log_date: date


class FeedLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    flock_id: str
    feed_id: str
    quantity_used_kg: float
    remaining_feed_stock_kg: Optional[float] = None
    low_stock_alert: Optional[bool] = False
    log_date: date
    created_at: Optional[datetime] = None


class HealthLogCreate(BaseModel):
    flock_id: str
    log_date: date
    log_type: str  # MORTALITY | VACCINATION | ILLNESS
    quantity: int = 1
    notes: Optional[str] = None


class HealthLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    flock_id: str
    log_date: date
    log_type: str
    quantity: int
    updated_active_hen_count: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class DashboardAnalyticsResponse(BaseModel):
    total_active_flocks: int
    total_active_hens: int
    today_egg_total: int
    overall_laying_rate_pct: float
    low_stock_alerts: list[dict[str, Any]] = Field(default_factory=list)
    recent_health_events_count: int
