from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class WireTransferBase(BaseModel):
    beneficiary_name: str = Field(..., alias="beneficiaryName", min_length=1)
    account_number: str = Field(..., alias="accountNumber", min_length=1)
    routing_number: str = Field(..., alias="routingNumber", min_length=1)
    amount: float = Field(..., gt=0)

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class WireTransferCreate(WireTransferBase):
    created_by: str = Field(..., alias="createdBy", min_length=1)


class WireTransferAction(BaseModel):
    approved_by: str = Field(..., alias="approvedBy", min_length=1)

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class WireTransferResponse(BaseModel):
    id: str
    beneficiary_name: str = Field(..., alias="beneficiaryName")
    account_number: str = Field(..., alias="accountNumber")
    routing_number: str = Field(..., alias="routingNumber")
    amount: float
    status: str
    created_by: str = Field(..., alias="createdBy")
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )
