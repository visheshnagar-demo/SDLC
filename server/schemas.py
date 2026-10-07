from datetime import date, datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field


# -------------------------------------------------------------
# User & Auth Schemas
# -------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(default="farm_worker", pattern="^(farm_manager|farm_worker)$")


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "farm_worker"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# -------------------------------------------------------------
# Cow Inventory Schemas
# -------------------------------------------------------------
class CowBase(BaseModel):
    tag_id: str
    breed: str
    date_of_birth: date
    gender: str = Field(pattern="^(Female|Male)$")
    health_status: str = Field(default="Healthy")
    weight_kg: float
    location: str


class CowCreate(CowBase):
    pass


class CowUpdate(BaseModel):
    tag_id: Optional[str] = None
    breed: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    health_status: Optional[str] = None
    weight_kg: Optional[float] = None
    location: Optional[str] = None


class CowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tag_id: str
    breed: str
    date_of_birth: date
    gender: str
    health_status: str
    weight_kg: float
    location: str
    created_at: datetime
    updated_at: datetime


class CowDetailResponse(CowResponse):
    recent_health_records: List["HealthRecordResponse"] = []
    recent_milk_logs: List["MilkYieldLogResponse"] = []
    seven_day_avg_yield: Optional[float] = 0.0


# -------------------------------------------------------------
# Health Record Schemas
# -------------------------------------------------------------
class HealthRecordBase(BaseModel):
    cow_id: str
    record_type: str
    title: str
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    event_date: date
    next_due_date: Optional[date] = None
    administered_by: str


class HealthRecordCreate(HealthRecordBase):
    pass


class HealthRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    cow_id: str
    record_type: str
    title: str
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    event_date: date
    next_due_date: Optional[date] = None
    administered_by: str
    created_at: datetime
    updated_at: datetime


# -------------------------------------------------------------
# Milk Yield Log Schemas
# -------------------------------------------------------------
class MilkYieldLogBase(BaseModel):
    cow_id: str
    logging_date: date
    morning_yield_liters: float = 0.0
    evening_yield_liters: float = 0.0
    notes: Optional[str] = None


class MilkYieldLogCreate(MilkYieldLogBase):
    pass


class MilkYieldLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    cow_id: str
    logging_date: date
    morning_yield_liters: float
    evening_yield_liters: float
    total_yield_liters: float
    yield_drop_alert: bool
    seven_day_average: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# -------------------------------------------------------------
# Analytics Schemas
# -------------------------------------------------------------
class AnalyticsSummaryResponse(BaseModel):
    total_cows: int
    lactating_cows: int
    today_total_yield_liters: float
    active_health_alerts: int
    status_breakdown: Dict[str, int]


class YieldTrendPoint(BaseModel):
    date: str
    total_yield: float
    average_per_cow: float
