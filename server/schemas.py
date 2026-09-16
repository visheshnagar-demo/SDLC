from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class WireCreateRequest(BaseModel):
    beneficiaryName: str = Field(..., description="Name of the recipient")
    accountNumber: str = Field(..., description="Account number")
    routingNumber: str = Field(..., description="Routing transit number")
    amount: float = Field(..., gt=0, description="Transfer amount in USD")
    createdBy: str = Field(
        ..., description="User ID of the Maker creating the transfer"
    )


class WireApprovalRequest(BaseModel):
    approvedBy: str = Field(
        ..., description="User ID of the Checker approving or rejecting the transfer"
    )


class WireTransferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    beneficiaryName: str
    accountNumber: str
    routingNumber: str
    amount: float
    status: str
    createdBy: str
    approvedBy: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
