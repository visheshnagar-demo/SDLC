from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WireTransferCreate(BaseModel):
    beneficiaryName: str = Field(..., description="Beneficiary entity/person name")
    accountNumber: str = Field(..., description="Recipient account number")
    routingNumber: str = Field(..., description="ABA 9-digit routing number")
    amount: float = Field(..., gt=0, description="Transfer amount in USD")

    model_config = ConfigDict(populate_by_name=True)


class WireTransferResponse(BaseModel):
    id: str
    beneficiaryName: str = Field(..., validation_alias="beneficiary_name")
    accountNumber: str = Field(..., validation_alias="account_number")
    routingNumber: str = Field(..., validation_alias="routing_number")
    amount: float
    status: str
    createdBy: str = Field(..., validation_alias="created_by")
    approvedBy: Optional[str] = Field(None, validation_alias="approved_by")
    createdAt: datetime = Field(..., validation_alias="created_at")
    updatedAt: datetime = Field(..., validation_alias="updated_at")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
