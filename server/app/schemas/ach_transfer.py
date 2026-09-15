from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class AchTransferEvaluateRequest(BaseModel):
    account_id: UUID = Field(..., description="Customer account unique identifier")
    amount: float = Field(
        ..., gt=0, description="Transfer amount in USD, must be greater than 0"
    )
    recipient_account: Optional[str] = Field(
        None, description="Recipient account number"
    )
    routing_number: Optional[str] = Field(
        None, description="9-digit ACH routing transit number"
    )

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return round(v, 2)


class AchTransferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    transfer_id: UUID = Field(..., description="Unique transaction ID")
    account_id: UUID = Field(..., description="Customer account identifier")
    amount: float = Field(..., description="Transaction amount in USD")
    rolling_24h_total: float = Field(
        ...,
        description="Total outbound ACH sum in rolling 24h including this transaction",
    )
    status: str = Field(..., description="Transaction status (e.g. APPROVED)")
    requires_aml_review: bool = Field(
        ..., description="Flag indicating if transaction requires AML compliance review"
    )
    created_at: datetime = Field(
        ..., description="Transaction creation timestamp (UTC)"
    )


class VelocityLimitExceededResponse(BaseModel):
    error_code: str = Field(
        "VELOCITY_LIMIT_EXCEEDED", description="Error code identifier"
    )
    detail: str = Field(
        "Rolling 24-hour ACH transfer limit exceeded.",
        description="Descriptive error detail",
    )
    account_id: UUID = Field(..., description="Customer account identifier")
    attempted_amount: float = Field(..., description="Amount attempted in this request")
    current_24h_total: float = Field(
        ..., description="Current 24h outbound sum prior to this request"
    )
    projected_24h_total: float = Field(
        ..., description="Projected 24h sum including the attempted amount"
    )
    limit: float = Field(10000.00, description="Velocity limit threshold in USD")
