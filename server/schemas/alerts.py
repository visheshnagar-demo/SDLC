import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field
from server.schemas.transactions import TransactionResponse


class AlertViolationResponse(BaseModel):
    id: str
    alert_id: str
    rule_id: str
    rule_name: str
    violation_details: dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class AlertListItemResponse(BaseModel):
    id: str
    transaction_id: str
    account_id: str
    severity: str
    risk_score: int
    status: str
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    triggered_rules_count: int = 0
    created_at: datetime.datetime
    updated_at: datetime.datetime
    transaction_summary: Optional[dict[str, Any]] = None

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[AlertListItemResponse]


class AlertDetailResponse(BaseModel):
    id: str
    transaction_id: str
    account_id: str
    severity: str
    risk_score: int
    status: str
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    transaction: Optional[TransactionResponse] = None
    violations: list[AlertViolationResponse] = Field(default_factory=list)
    audit_history: list[dict[str, Any]] = Field(default_factory=list)

    class Config:
        from_attributes = True


class AlertStatusUpdateRequest(BaseModel):
    status: str = Field(
        ..., description="NEW | UNDER_REVIEW | ESCALATED | CONFIRMED_FRAUD | DISMISSED"
    )
    notes: Optional[str] = Field(
        None, description="Analyst investigation notes or justification"
    )
    actor: Optional[str] = Field(
        "analyst@bank.com", description="User or email initiating the status update"
    )
    assigned_to: Optional[str] = Field(
        None, description="Investigator username/email assigned"
    )


class AlertStatsResponse(BaseModel):
    total_open: int
    critical_count: int
    under_review_count: int
    confirmed_fraud_amount_30d: float
    detection_accuracy_pct: float
