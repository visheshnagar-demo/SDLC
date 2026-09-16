from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WireCreate(BaseModel):
    beneficiaryName: str = Field(
        ..., min_length=1, description="Legal name of beneficiary"
    )
    accountNumber: str = Field(
        ..., min_length=1, description="Beneficiary bank account number"
    )
    routingNumber: str = Field(
        ..., min_length=1, description="ABA routing / transit number"
    )
    amount: float = Field(..., gt=0, description="Wire transfer amount in USD")
    createdBy: str = Field(
        ...,
        min_length=1,
        description="User ID or name of the Maker initiating the wire",
    )


class WireApprove(BaseModel):
    approvedBy: str = Field(
        ...,
        min_length=1,
        description="User ID or name of the Checker approving the wire",
    )


class WireReject(BaseModel):
    approvedBy: str = Field(
        ...,
        min_length=1,
        description="User ID or name of the Checker rejecting the wire",
    )


class WireResponse(BaseModel):
    id: str
    beneficiaryName: str
    accountNumber: str
    routingNumber: str
    amount: float
    status: str
    createdBy: str
    approvedBy: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
