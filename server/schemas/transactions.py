import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class TransactionEvaluateRequest(BaseModel):
    account_id: str = Field(..., description="Account identifier", min_length=1)
    amount: float = Field(..., description="Transaction monetary amount", gt=0)
    currency: str = Field(
        "USD", description="ISO 3-letter currency code", min_length=3, max_length=3
    )
    latitude: Optional[float] = Field(
        None, description="Latitude coordinate between -90 and 90"
    )
    longitude: Optional[float] = Field(
        None, description="Longitude coordinate between -180 and 180"
    )
    location_name: Optional[str] = Field(
        None, description="Human-readable city/region name"
    )
    merchant: Optional[str] = Field(None, description="Merchant or beneficiary entity")
    timestamp: Optional[datetime.datetime] = Field(
        None, description="Transaction timestamp in UTC"
    )


class TriggeredRuleDetail(BaseModel):
    rule_id: str
    rule_name: str
    rule_type: str
    details: dict[str, Any]


class TransactionEvaluateResponse(BaseModel):
    transaction_id: str
    account_id: str
    is_suspicious: bool
    risk_score: int
    severity: Optional[str] = None
    triggered_rules: list[TriggeredRuleDetail] = Field(default_factory=list)
    alert_id: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    account_id: str
    amount: float
    currency: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    merchant: Optional[str] = None
    timestamp: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[TransactionResponse]
