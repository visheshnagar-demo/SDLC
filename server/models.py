import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from server.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class Tank(Base):
    __tablename__ = "tanks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    capacity_liters = Column(Float, nullable=False)
    water_type = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    telemetry_readings = relationship(
        "TelemetryReading", back_populates="tank", cascade="all, delete-orphan"
    )
    thresholds = relationship(
        "AlertThreshold", back_populates="tank", cascade="all, delete-orphan"
    )
    alerts = relationship(
        "Alert", back_populates="tank", cascade="all, delete-orphan"
    )
    feeding_schedules = relationship(
        "FeedingSchedule", back_populates="tank", cascade="all, delete-orphan"
    )
    feeding_logs = relationship(
        "FeedingLog", back_populates="tank", cascade="all, delete-orphan"
    )
    fish_health_records = relationship(
        "FishHealthRecord", back_populates="tank", cascade="all, delete-orphan"
    )
    equipment = relationship(
        "Equipment", back_populates="tank", cascade="all, delete-orphan"
    )


class TelemetryReading(Base):
    __tablename__ = "telemetry_readings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tank_id = Column(String(36), ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    ph_level = Column(Float, nullable=False)
    dissolved_oxygen = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    ammonia_ppm = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    tank = relationship("Tank", back_populates="telemetry_readings")


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tank_id = Column(String(36), ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    parameter_name = Column(String(50), nullable=False)
    min_threshold = Column(Float, nullable=False)
    max_threshold = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    tank = relationship("Tank", back_populates="thresholds")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tank_id = Column(String(36), ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    parameter_name = Column(String(50), nullable=False)
    recorded_value = Column(Float, nullable=False)
    threshold_violated = Column(String(20), nullable=False)  # 'MIN' or 'MAX'
    severity = Column(String(20), nullable=False)  # 'WARNING' or 'CRITICAL'
    status = Column(String(20), default="ACTIVE", nullable=False)  # 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
    message = Column(Text, nullable=False)
    triggered_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    tank = relationship("Tank", back_populates="alerts")


class FeedingSchedule(Base):
    __tablename__ = "feeding_schedules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tank_id = Column(String(36), ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    food_type = Column(String(100), nullable=False)
    portion_grams = Column(Float, nullable=False)
    frequency = Column(String(50), nullable=False)  # e.g., 'Daily', 'Twice Daily', 'Weekly'
    scheduled_time = Column(String(10), nullable=False)  # e.g. '08:00'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    tank = relationship("Tank", back_populates="feeding_schedules")
    logs = relationship("FeedingLog", back_populates="schedule")


class FeedingLog(Base):
    __tablename__ = "feeding_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tank_id = Column(String(36), ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(
        String(36), ForeignKey("feeding_schedules.id", ondelete="SET NULL"), nullable=True, index=True
    )
    food_type = Column(String(100), nullable=False)
    portion_grams = Column(Float, nullable=False)
    fed_by = Column(String(100), nullable=False)
    fed_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    tank = relationship("Tank", back_populates="feeding_logs")
    schedule = relationship("FeedingSchedule", back_populates="logs")


class FishHealthRecord(Base):
    __tablename__ = "fish_health_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tank_id = Column(String(36), ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    species = Column(String(100), nullable=False)
    population_count = Column(Integer, nullable=False)
    health_status = Column(String(50), nullable=False)  # e.g. 'Healthy', 'Observing', 'Symptomatic', 'Treated'
    symptoms = Column(Text, nullable=True)
    treatment_notes = Column(Text, nullable=True)
    is_quarantined = Column(Boolean, default=False, nullable=False)
    recorded_by = Column(String(100), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    tank = relationship("Tank", back_populates="fish_health_records")


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tank_id = Column(String(36), ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    equipment_type = Column(String(50), nullable=False)  # 'Filter', 'Pump', 'Aerator', 'Heater', 'Lighting'
    model_number = Column(String(100), nullable=True)
    maintenance_interval_days = Column(Integer, nullable=False)
    last_serviced_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    next_due_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(30), default="OPERATIONAL", nullable=False)  # 'OPERATIONAL', 'MAINTENANCE_DUE', 'OVERDUE', 'FAILED'
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    tank = relationship("Tank", back_populates="equipment")
    maintenance_logs = relationship(
        "EquipmentMaintenanceLog", back_populates="equipment", cascade="all, delete-orphan"
    )


class EquipmentMaintenanceLog(Base):
    __tablename__ = "equipment_maintenance_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    equipment_id = Column(
        String(36), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_date = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    action_taken = Column(String(100), nullable=False)
    technician_notes = Column(Text, nullable=True)
    performed_by = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    equipment = relationship("Equipment", back_populates="maintenance_logs")
