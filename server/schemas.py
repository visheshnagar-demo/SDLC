from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


# ==========================================
# Existing Payment & Transaction Schemas
# ==========================================

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


# ==========================================
# Fixed Deposit & Savings Account Schemas (SCRUM-426)
# ==========================================

class SavingsAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    account_number: str
    account_type: str = "SAVINGS"
    currency: str = "USD"
    available_balance: float
    status: str
    is_eligible_for_fd: bool
    ineligibility_reason: Optional[str] = None


class SavingsAccountListResponse(BaseModel):
    accounts: list[SavingsAccountResponse]


class FDRatePlan(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenure_months: int
    interest_rate: float
    min_deposit: float = 500.00


class FDProjection(BaseModel):
    deposit_amount: float
    tenure_months: int
    interest_rate: float
    payout_frequency: str = "AT_MATURITY"
    total_interest_earned: float
    maturity_amount: float
    maturity_date: str


class FDRatesResponse(BaseModel):
    plans: list[FDRatePlan]
    calculation: Optional[FDProjection] = None


class FDCreateRequest(BaseModel):
    source_account_id: str
    deposit_amount: float = Field(gt=0, description="Deposit amount in USD ($500.00 minimum)")
    tenure_months: int = Field(description="Tenure duration in months (e.g. 6, 12, 24, 36)")
    payout_frequency: str = Field(default="AT_MATURITY", description="Payout frequency (e.g. AT_MATURITY, MONTHLY, QUARTERLY)")
    transaction_pin: str = Field(description="4-digit transaction authorization PIN")


class FDAccountSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    fd_account_number: str
    source_account_id: str
    deposit_amount: float
    interest_rate: float
    tenure_months: int
    payout_frequency: str
    maturity_amount: float
    maturity_date: str
    status: str
    created_at: Optional[str] = None


class FDReceiptSummary(BaseModel):
    receipt_number: str
    download_url: str


class FDCreateResponse(BaseModel):
    status: str = "SUCCESS"
    message: str = "Fixed Deposit account opened successfully."
    fixed_deposit: FDAccountSummary
    receipt: FDReceiptSummary
