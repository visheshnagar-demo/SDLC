from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# -------------------- Tanks --------------------
class TankBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=100)
    capacity_liters: float = Field(..., gt=0)
    water_type: str = Field(..., min_length=1, max_length=50)


class TankCreate(TankBase):
    pass


class TankUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, min_length=1, max_length=100)
    capacity_liters: Optional[float] = Field(None, gt=0)
    water_type: Optional[str] = Field(None, min_length=1, max_length=50)


class TankResponse(TankBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------- Telemetry --------------------
class TelemetryReadingBase(BaseModel):
    tank_id: str
    ph_level: float = Field(..., ge=0.0, le=14.0)
    dissolved_oxygen: float = Field(..., ge=0.0)
    temperature_c: float
    ammonia_ppm: float = Field(..., ge=0.0)
    recorded_at: Optional[datetime] = None


class TelemetryReadingCreate(TelemetryReadingBase):
    pass


class TelemetryReadingResponse(BaseModel):
    id: str
    tank_id: str
    ph_level: float
    dissolved_oxygen: float
    temperature_c: float
    ammonia_ppm: float
    recorded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LatestTelemetryResponse(BaseModel):
    tank_id: str
    reading: Optional[TelemetryReadingResponse] = None
    ph_status: str = "SAFE"  # "SAFE", "WARNING", "CRITICAL"
    oxygen_status: str = "SAFE"
    temperature_status: str = "SAFE"
    ammonia_status: str = "SAFE"

    model_config = ConfigDict(from_attributes=True)


# -------------------- Thresholds --------------------
class AlertThresholdBase(BaseModel):
    tank_id: str
    parameter_name: str = Field(..., min_length=1, max_length=50)
    min_threshold: float
    max_threshold: float
    is_active: bool = True


class AlertThresholdCreate(AlertThresholdBase):
    pass


class AlertThresholdResponse(AlertThresholdBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------- Alerts --------------------
class AlertBase(BaseModel):
    tank_id: str
    parameter_name: str
    recorded_value: float
    threshold_violated: str
    severity: str
    status: str = "ACTIVE"
    message: str


class AlertCreate(AlertBase):
    triggered_at: Optional[datetime] = None


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|ACKNOWLEDGED|RESOLVED)$")


class AlertResponse(AlertBase):
    id: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------- Feeding --------------------
class FeedingScheduleBase(BaseModel):
    tank_id: str
    food_type: str = Field(..., min_length=1, max_length=100)
    portion_grams: float = Field(..., gt=0)
    frequency: str = Field(..., min_length=1, max_length=50)
    scheduled_time: str = Field(..., min_length=1, max_length=10)
    is_active: bool = True


class FeedingScheduleCreate(FeedingScheduleBase):
    pass


class FeedingScheduleResponse(FeedingScheduleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedingLogBase(BaseModel):
    tank_id: str
    schedule_id: Optional[str] = None
    food_type: str = Field(..., min_length=1, max_length=100)
    portion_grams: float = Field(..., gt=0)
    fed_by: str = Field(..., min_length=1, max_length=100)
    fed_at: Optional[datetime] = None
    notes: Optional[str] = None


class FeedingLogCreate(FeedingLogBase):
    pass


class FeedingLogResponse(FeedingLogBase):
    id: str
    fed_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------- Fish Health Records --------------------
class FishHealthRecordBase(BaseModel):
    tank_id: str
    species: str = Field(..., min_length=1, max_length=100)
    population_count: int = Field(..., ge=0)
    health_status: str = Field(..., min_length=1, max_length=50)
    symptoms: Optional[str] = None
    treatment_notes: Optional[str] = None
    is_quarantined: bool = False
    recorded_by: str = Field(..., min_length=1, max_length=100)
    recorded_at: Optional[datetime] = None


class FishHealthRecordCreate(FishHealthRecordBase):
    pass


class FishHealthRecordResponse(FishHealthRecordBase):
    id: str
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------- Equipment --------------------
class EquipmentBase(BaseModel):
    tank_id: str
    name: str = Field(..., min_length=1, max_length=100)
    equipment_type: str = Field(..., min_length=1, max_length=50)
    model_number: Optional[str] = None
    maintenance_interval_days: int = Field(..., gt=0)
    last_serviced_at: Optional[datetime] = None


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentResponse(BaseModel):
    id: str
    tank_id: str
    name: str
    equipment_type: str
    model_number: Optional[str] = None
    maintenance_interval_days: int
    last_serviced_at: datetime
    next_due_at: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EquipmentMaintenanceLogBase(BaseModel):
    service_date: Optional[datetime] = None
    action_taken: str = Field(..., min_length=1, max_length=100)
    technician_notes: Optional[str] = None
    performed_by: str = Field(..., min_length=1, max_length=100)


class EquipmentMaintenanceLogCreate(EquipmentMaintenanceLogBase):
    pass


class EquipmentMaintenanceLogResponse(EquipmentMaintenanceLogBase):
    id: str
    equipment_id: str
    service_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


MaintenanceLogResponse = EquipmentMaintenanceLogResponse
