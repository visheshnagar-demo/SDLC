from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# CATTLE SCHEMAS
# ==========================================
class CattleBase(BaseModel):
    tag_number: str = Field(..., description="Unique ear tag code (e.g. COW-1042)")
    rfid_tag: str = Field(
        ..., description="Unique 12-15 digit RFID tag (e.g. 982 000010428912)"
    )
    breed: str = Field(default="Holstein-Friesian")
    gender: str = Field(default="Female")
    date_of_birth: date
    dam_id: Optional[str] = None
    sire_id: Optional[str] = None
    status: str = Field(
        default="Active"
    )  # Active, Lactating, Dry, Inseminated, Pregnant, Calved, Culled, Deceased
    body_condition_score: Optional[float] = Field(default=3.0, ge=1.0, le=5.0)
    weight_kg: Optional[float] = Field(default=600.0, ge=50.0, le=1500.0)


class CattleCreate(CattleBase):
    pass


class CattleUpdate(BaseModel):
    tag_number: Optional[str] = None
    rfid_tag: Optional[str] = None
    breed: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    dam_id: Optional[str] = None
    sire_id: Optional[str] = None
    status: Optional[str] = None
    body_condition_score: Optional[float] = None
    weight_kg: Optional[float] = None


class CattleOut(CattleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# MILK LOG SCHEMAS
# ==========================================
class MilkLogBase(BaseModel):
    cow_id: str
    milking_date: date
    session: str = Field(default="Morning")  # Morning, Evening, Afternoon
    yield_liters: float
    fat_percentage: Optional[float] = None
    protein_percentage: Optional[float] = None
    somatic_cell_count: Optional[int] = None


class MilkLogCreate(MilkLogBase):
    pass


class MilkLogOut(MilkLogBase):
    id: str
    is_withheld: bool
    variance_alert: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MilkDailyTrend(BaseModel):
    date: str
    total_yield: float
    morning_yield: float
    evening_yield: float
    avg_yield_per_cow: float
    session_count: int


class MilkSummaryOut(BaseModel):
    total_yield: float
    average_yield_per_cow: float
    morning_yield: float
    evening_yield: float
    afternoon_yield: float
    rolling_7d_yield: float
    withheld_yield: float
    variance_alerts_count: int
    daily_trends: List[MilkDailyTrend] = []


# ==========================================
# BREEDING SCHEMAS
# ==========================================
class BreedingRecordBase(BaseModel):
    cow_id: str
    stage: str = Field(
        default="In Heat"
    )  # In Heat, Inseminated, Confirmed Pregnant, Dry Period, Calved, Failed Conception
    event_date: date
    insemination_date: Optional[date] = None
    sire_rfid_or_code: Optional[str] = None
    notes: Optional[str] = None


class BreedingRecordCreate(BreedingRecordBase):
    pass


class BreedingRecordUpdate(BaseModel):
    stage: Optional[str] = None
    event_date: Optional[date] = None
    insemination_date: Optional[date] = None
    sire_rfid_or_code: Optional[str] = None
    notes: Optional[str] = None


class BreedingRecordOut(BreedingRecordBase):
    id: str
    gestation_check_due_date: Optional[date] = None
    expected_calving_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# HEALTH & VETERINARY SCHEMAS
# ==========================================
class HealthRecordBase(BaseModel):
    cow_id: str
    record_type: str = Field(
        default="Treatment"
    )  # Treatment, Vaccination, Routine Check, Surgery, Scheduled Visit
    diagnosis: str
    medication_administered: Optional[str] = None
    dosage: Optional[str] = None
    treatment_date: Optional[datetime] = None
    scheduled_date: Optional[datetime] = None
    status: str = Field(default="Completed")  # Completed, Scheduled, Overdue, Cancelled
    milk_withdrawal_hours: int = 0
    meat_withdrawal_days: int = 0
    veterinarian_name: str


class HealthRecordCreate(HealthRecordBase):
    pass


class VetScheduleCreate(BaseModel):
    cow_id: str
    diagnosis: str = Field(default="Routine Health & Vaccination Check")
    scheduled_date: datetime
    veterinarian_name: str
    notes: Optional[str] = None


class HealthRecordOut(BaseModel):
    id: str
    cow_id: str
    record_type: str
    diagnosis: str
    medication_administered: Optional[str] = None
    dosage: Optional[str] = None
    treatment_date: datetime
    scheduled_date: Optional[datetime] = None
    status: str
    milk_withdrawal_hours: int
    milk_withdrawal_end: Optional[datetime] = None
    meat_withdrawal_days: int
    veterinarian_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActiveWithdrawalOut(BaseModel):
    record_id: str
    cow_id: str
    tag_number: str
    rfid_tag: str
    medication_administered: Optional[str]
    diagnosis: str
    treatment_date: datetime
    milk_withdrawal_hours: int
    milk_withdrawal_end: datetime
    hours_remaining: float


# ==========================================
# FEED & RATION SCHEMAS
# ==========================================
class FeedRationBase(BaseModel):
    ration_name: str
    target_group: str  # High Yield, Mid Yield, Dry Cows, Heifers
    dry_matter_kg_per_day: float = 20.0
    silage_pct: float = 60.0
    concentrate_pct: float = 25.0
    forage_supplements_pct: float = 15.0


class FeedRationCreate(FeedRationBase):
    pass


class FeedRationUpdate(BaseModel):
    ration_name: Optional[str] = None
    target_group: Optional[str] = None
    dry_matter_kg_per_day: Optional[float] = None
    silage_pct: Optional[float] = None
    concentrate_pct: Optional[float] = None
    forage_supplements_pct: Optional[float] = None


class FeedRationOut(FeedRationBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedAllocationCalculateRequest(BaseModel):
    cow_id: Optional[str] = None
    lactation_stage: str = Field(
        default="Mid Lactation",
        description="Early Lactation, Mid Lactation, Late Lactation, Dry",
    )
    daily_milk_yield_liters: float = Field(default=25.0, ge=0.0)
    body_condition_score: float = Field(default=3.0, ge=1.0, le=5.0)
    body_weight_kg: float = Field(default=600.0, ge=100.0)


class FeedAllocationResultOut(BaseModel):
    cow_id: Optional[str] = None
    lactation_stage: str
    daily_milk_yield_liters: float
    body_condition_score: float
    body_weight_kg: float
    recommended_dry_matter_kg: float
    silage_kg: float
    concentrate_kg: float
    forage_supplements_kg: float
    ration_target_group: str
    formulation_notes: str


class FeedInventoryBase(BaseModel):
    feed_name: str
    category: str  # Forage, Concentrate, Mineral/Supplement
    current_stock_kg: float
    daily_consumption_kg: float
    reorder_threshold_kg: Optional[float] = None


class FeedInventoryCreate(FeedInventoryBase):
    pass


class FeedInventoryUpdate(BaseModel):
    feed_name: Optional[str] = None
    category: Optional[str] = None
    current_stock_kg: Optional[float] = None
    daily_consumption_kg: Optional[float] = None
    reorder_threshold_kg: Optional[float] = None


class FeedInventoryOut(BaseModel):
    id: str
    feed_name: str
    category: str
    current_stock_kg: float
    daily_consumption_kg: float
    reorder_threshold_kg: float
    reorder_alert: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CATTLE DETAIL SCHEMA (WITH SUB-RECORDS)
# ==========================================
class CattleDetailOut(CattleOut):
    recent_milk_logs: List[MilkLogOut] = []
    recent_breeding_records: List[BreedingRecordOut] = []
    recent_health_records: List[HealthRecordOut] = []
    has_active_withdrawal: bool = False


# ==========================================
# ANALYTICS & DASHBOARD SCHEMAS
# ==========================================
class LactationCurvePoint(BaseModel):
    date: str
    avg_yield_liters: float
    total_yield_liters: float


class AlertItem(BaseModel):
    id: str
    type: str  # mastitis_warning, active_withdrawal, inventory_reorder, incomplete_data, scheduled_vet
    severity: str  # critical, warning, info
    title: str
    message: str
    created_at: str


class DashboardAnalyticsOut(BaseModel):
    total_cows: int
    active_cows_count: int
    active_lactating_count: int
    dry_count: int
    pregnant_count: int
    culled_count: int
    total_daily_yield: float
    rolling_7d_yield: float
    average_yield_per_cow: float
    fertility_rate: float
    feed_conversion_efficiency: float
    active_withholding_count: int
    culling_rate: float
    data_incomplete_warning: bool
    lactation_curve: List[LactationCurvePoint] = []
    alerts: List[AlertItem] = []
