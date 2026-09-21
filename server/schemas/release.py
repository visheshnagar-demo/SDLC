from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ReleaseHoldCreate(BaseModel):
    inmate_id: str
    hold_type: str  # warrant, detainer, court_hold
    issuing_agency: Optional[str] = "Law Enforcement Agency"
    description: Optional[str] = "Active hold/detainer"


class ReleaseHoldResponse(BaseModel):
    id: str
    inmate_id: str
    hold_type: str
    issuing_agency: str
    description: Optional[str] = "Active hold/detainer"
    is_active: bool
    cleared_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReleaseEligibilityResponse(BaseModel):
    inmate_id: str
    inmate_name: str
    is_eligible_for_release: bool
    blocking_holds: List[ReleaseHoldResponse] = []
    has_active_warrants: bool
    has_active_detainers: bool
    property_cleared: bool
    discharge_order_verified: bool
    summary: str


class ReleaseAuthorizeRequest(BaseModel):
    inmate_id: str
    discharge_order_verified: bool = True
    court_discharge_order: Optional[str] = None
    property_returned: bool = True
    victim_notified: bool = False
    authorized_by: Optional[str] = "System Admin"
    force_override: bool = False


class ReleaseResponse(BaseModel):
    id: str
    inmate_id: str
    discharge_order_verified: bool
    property_returned: bool
    victim_notified: bool
    authorized_by: Optional[str] = "System Admin"
    release_time: Optional[datetime] = None
    status: str = "DISCHARGED"
    created_at: datetime

    class Config:
        from_attributes = True
