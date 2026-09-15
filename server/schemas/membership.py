from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MembershipPlanBase(BaseModel):
    name: str
    code: str
    description: str
    price_monthly: float
    benefits: str
    is_active: bool = True


class MembershipPlanCreate(MembershipPlanBase):
    pass


class MembershipPlanRead(MembershipPlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


class MembershipSubscribeRequest(BaseModel):
    plan_id: str


class UserMembershipRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    plan_id: str
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    created_at: datetime
    plan: Optional[MembershipPlanRead] = None
