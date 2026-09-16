from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class WireCreate(BaseModel):
    beneficiaryName: str = Field(..., description="Beneficiary legal name")
    accountNumber: str = Field(..., description="Destination account number")
    routingNumber: str = Field(..., description="Destination ABA/Routing number")
    amount: float = Field(..., gt=0, description="Transfer amount in USD")
    createdBy: str = Field(..., description="Maker user identifier")

    model_config = ConfigDict(populate_by_name=True)


class WireApproveRequest(BaseModel):
    approvedBy: str = Field(..., description="Checker user identifier")

    model_config = ConfigDict(populate_by_name=True)


class WireRejectRequest(BaseModel):
    approvedBy: str = Field(..., description="Checker user identifier")

    model_config = ConfigDict(populate_by_name=True)


class WireResponse(BaseModel):
    id: str
    beneficiaryName: str
    accountNumber: str
    routingNumber: str
    amount: float
    status: str
    createdBy: str
    approvedBy: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
