from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class WireCreate(BaseModel):
    beneficiary_name: str = Field(..., alias="beneficiaryName")
    account_number: str = Field(..., alias="accountNumber")
    routing_number: str = Field(..., alias="routingNumber")
    amount: float = Field(..., gt=0)

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "beneficiaryName": "Acme Industrial Corp",
                "accountNumber": "1234567890",
                "routingNumber": "021000021",
                "amount": 15000.00,
            }
        },
    )


class WireResponse(BaseModel):
    id: str
    beneficiary_name: str = Field(..., alias="beneficiaryName")
    account_number: str = Field(..., alias="accountNumber")
    routing_number: str = Field(..., alias="routingNumber")
    amount: float
    status: str
    created_by: str = Field(..., alias="createdBy")
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
