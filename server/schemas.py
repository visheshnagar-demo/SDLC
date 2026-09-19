from typing import Any, Optional, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


# ================= USER & AUTH SCHEMAS =================
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "Journalist"  # Admin, News Manager, Editor, Journalist, Operator


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional["UserResponse"] = None


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ================= CHANNEL SCHEMAS =================
class ChannelBase(BaseModel):
    name: str
    code: str
    stream_url: Optional[str] = None
    resolution: str = "1080p"
    language: str = "English"
    status: str = "ACTIVE"  # ACTIVE, OFF_AIR, MAINTENANCE, EMERGENCY_OVERRIDE
    is_live: bool = False


class ChannelCreate(ChannelBase):
    pass


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    stream_url: Optional[str] = None
    resolution: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None
    is_live: Optional[bool] = None


class ChannelResponse(ChannelBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ================= PROGRAM SCHEMAS =================
class ProgramBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    default_duration_minutes: int = 60
    host_name: Optional[str] = None
    is_recurring: bool = True


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    default_duration_minutes: Optional[int] = None
    host_name: Optional[str] = None
    is_recurring: Optional[bool] = None


class ProgramResponse(ProgramBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ================= SCHEDULE SCHEMAS =================
class ScheduleBase(BaseModel):
    channel_id: str
    program_id: str
    start_time: datetime
    end_time: datetime
    status: str = "SCHEDULED"  # SCHEDULED, LIVE, COMPLETED, CANCELLED, INTERRUPTED
    is_emergency_override: bool = False
    notes: Optional[str] = None


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    channel_id: Optional[str] = None
    program_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    is_emergency_override: Optional[bool] = None
    notes: Optional[str] = None


class ScheduleResponse(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    channel: Optional[ChannelResponse] = None
    program: Optional[ProgramResponse] = None


class EmergencyOverrideCreate(BaseModel):
    title: str
    description: str


class EmergencyOverrideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    channel_id: str
    triggered_by_id: str
    interrupted_schedule_id: Optional[str] = None
    title: str
    description: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime


# ================= ARTICLE SCHEMAS =================
class ArticleBase(BaseModel):
    headline: str
    body: str
    summary: Optional[str] = None
    channel_id: Optional[str] = None
    program_id: Optional[str] = None
    is_ticker_item: bool = False
    priority: str = "NORMAL"  # NORMAL, HIGH, URGENT, BREAKING


class ArticleCreate(ArticleBase):
    status: str = "DRAFT"  # DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED


class ArticleUpdate(BaseModel):
    headline: Optional[str] = None
    body: Optional[str] = None
    summary: Optional[str] = None
    channel_id: Optional[str] = None
    program_id: Optional[str] = None
    is_ticker_item: Optional[bool] = None
    priority: Optional[str] = None
    version: Optional[int] = None  # Expected version for optimistic locking check


class ArticleStatusUpdate(BaseModel):
    status: str  # DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED
    reviewer_id: Optional[str] = None


class ArticleResponse(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author_id: str
    reviewer_id: Optional[str] = None
    status: str
    version: int
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    channel: Optional[ChannelResponse] = None
    program: Optional[ProgramResponse] = None


# ================= DASHBOARD SCHEMAS =================
class DashboardMetricsResponse(BaseModel):
    active_channels: str = "3 / 3"
    concurrent_viewers: str = "1.24M"
    transmission_health_pct: float = 99.98
    active_emergency_alerts: int = 0


# ================= EXISTING PAYMENT SCHEMAS =================
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
