from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


class WireStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class WireCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    beneficiaryName: str = Field(..., alias="beneficiary_name")
    accountNumber: str = Field(..., alias="account_number")
    routingNumber: str = Field(..., alias="routing_number")
    amount: float = Field(..., gt=0)

    @field_validator("beneficiaryName", "accountNumber", "routingNumber", mode="before")
    @classmethod
    def check_not_empty(cls, v: Any) -> str:
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                raise ValueError("String field cannot be empty")
            return v_str
        return str(v)


class WireResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    beneficiaryName: str
    accountNumber: str
    routingNumber: str
    amount: float
    status: str
    createdBy: str
    approvedBy: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # Snake_case fields for Python test compatibility
    beneficiary_name: Optional[str] = None
    account_number: Optional[str] = None
    routing_number: Optional[str] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None


class MetricsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    totalVolume: float
    pendingCount: int
    autoApprovedCount: int
    approvedCount: int
    rejectedCount: int
