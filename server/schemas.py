from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime


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


# Job Management Schemas (SCRUM-385)

VALID_JOB_STATUSES = {"draft", "published", "closed", "archived"}


class JobBase(BaseModel):
    title: str = Field(..., min_length=1, description="Job title")
    description: str = Field(..., min_length=1, description="Detailed job description")
    department: str = Field(..., min_length=1, description="Department name")
    location: str = Field(..., min_length=1, description="Location or Remote")
    employment_type: str = Field(
        default="Full-time", description="Full-time, Part-time, Contract, Internship"
    )
    salary_min: Optional[float] = Field(default=None, description="Minimum salary")
    salary_max: Optional[float] = Field(default=None, description="Maximum salary")
    currency: str = Field(default="USD", description="Currency code")
    status: str = Field(
        default="draft", description="draft, published, closed, archived"
    )

    @model_validator(mode="after")
    def validate_job_fields(self) -> "JobBase":
        if not self.title or not self.title.strip():
            raise ValueError("Job title cannot be empty")
        if not self.description or not self.description.strip():
            raise ValueError("Job description cannot be empty")
        if self.salary_min is not None and self.salary_min < 0:
            raise ValueError("Minimum salary cannot be negative")
        if self.salary_max is not None and self.salary_max < 0:
            raise ValueError("Maximum salary cannot be negative")
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("Minimum salary cannot exceed maximum salary")
        if self.status and self.status.lower() not in VALID_JOB_STATUSES:
            raise ValueError(
                f"Invalid status '{self.status}'. Must be one of {list(VALID_JOB_STATUSES)}"
            )
        return self


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None

    @model_validator(mode="after")
    def validate_job_update(self) -> "JobUpdate":
        if self.title is not None and not self.title.strip():
            raise ValueError("Job title cannot be empty")
        if self.description is not None and not self.description.strip():
            raise ValueError("Job description cannot be empty")
        if self.salary_min is not None and self.salary_min < 0:
            raise ValueError("Minimum salary cannot be negative")
        if self.salary_max is not None and self.salary_max < 0:
            raise ValueError("Maximum salary cannot be negative")
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("Minimum salary cannot exceed maximum salary")
        if self.status and self.status.lower() not in VALID_JOB_STATUSES:
            raise ValueError(
                f"Invalid status '{self.status}'. Must be one of {list(VALID_JOB_STATUSES)}"
            )
        return self


class JobStatusUpdate(BaseModel):
    status: str = Field(
        ..., description="Target status: draft, published, closed, archived"
    )

    @model_validator(mode="after")
    def validate_status(self) -> "JobStatusUpdate":
        if not self.status or self.status.lower() not in VALID_JOB_STATUSES:
            raise ValueError(
                f"Invalid status '{self.status}'. Must be one of {list(VALID_JOB_STATUSES)}"
            )
        return self


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    department: str
    location: str
    employment_type: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "USD"
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[JobResponse]


class JobAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    action: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    performed_by: str
    created_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_role: str
    user_email: str
