import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    transactions = relationship("Transaction", back_populates="user")
    refunds = relationship("Refund", back_populates="actor")


class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id = Column(String, primary_key=True, default=lambda: f"cs_{uuid.uuid4().hex[:16]}")
    session_id = Column(String, unique=True, index=True, nullable=False)
    payment_intent_id = Column(String, index=True, nullable=False)
    client_secret = Column(String, nullable=False)
    customer_email = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_currency = Column(String, nullable=False)
    exchange_rate = Column(Float, default=1.0, nullable=False)
    items_json = Column(Text, default="[]", nullable=False)
    status = Column(String, default="PENDING", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: f"tx_{uuid.uuid4().hex[:12]}")
    payment_intent_id = Column(String, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    customer_email = Column(String, index=True, nullable=False)
    payment_method = Column(String, default="card", nullable=False)
    amount = Column(Float, nullable=False)
    base_currency = Column(String, default="USD", nullable=False)
    target_currency = Column(String, default="USD", nullable=False)
    converted_amount = Column(Float, nullable=False)
    exchange_rate = Column(Float, default=1.0, nullable=False)
    status = Column(String, default="COMPLETED", nullable=False)
    refunded_amount = Column(Float, default=0.0, nullable=False)
    remaining_refundable_balance = Column(Float, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    user = relationship("User", back_populates="transactions")
    refunds = relationship(
        "Refund", back_populates="transaction", cascade="all, delete-orphan"
    )
    audit_logs = relationship("AuditLog", back_populates="transaction")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(
        String, primary_key=True, default=lambda: f"ref_{uuid.uuid4().hex[:12]}"
    )
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    refund_amount = Column(Float, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    reason = Column(String, nullable=False)
    memo = Column(String, nullable=True)
    status = Column(String, default="COMPLETED", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    transaction = relationship("Transaction", back_populates="refunds")
    actor = relationship("User", back_populates="refunds")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        String, primary_key=True, default=lambda: f"log_{uuid.uuid4().hex[:12]}"
    )
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    event_type = Column(String, index=True, nullable=False)
    ip_address = Column(String, default="127.0.0.1", nullable=False)
    masked_payload = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    transaction = relationship("Transaction", back_populates="audit_logs")


class ExchangeRateCache(Base):
    __tablename__ = "exchange_rate_caches"

    id = Column(String, primary_key=True, default=generate_uuid)
    base_currency = Column(String, index=True, nullable=False)
    rates_json = Column(Text, nullable=False)
    fetched_at = Column(DateTime, default=get_utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String, primary_key=True)
    event_type = Column(String, nullable=False)
    processed_at = Column(DateTime, default=get_utc_now, nullable=False)


# Rainwater Harvesting Management System Models


class Tank(Base):
    __tablename__ = "tanks"

    id = Column(
        String, primary_key=True, default=lambda: f"tank_{uuid.uuid4().hex[:8]}"
    )
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    total_capacity_liters = Column(Float, nullable=False)
    current_volume_liters = Column(Float, default=0.0, nullable=False)
    net_inflow_rate_lpm = Column(Float, default=0.0, nullable=False)
    net_outflow_rate_lpm = Column(Float, default=0.0, nullable=False)
    status = Column(
        String, default="ACTIVE", nullable=False
    )  # ACTIVE, MAINTENANCE, OVERFLOW, WARNING, OFFLINE
    supply_pump_active = Column(Boolean, default=False, nullable=False)
    overflow_valve_open = Column(Boolean, default=False, nullable=False)
    municipal_backup_active = Column(Boolean, default=False, nullable=False)
    clean_valve_open = Column(Boolean, default=True, nullable=False)
    pump_operating_hours = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    sensors = relationship(
        "Sensor", back_populates="tank", cascade="all, delete-orphan"
    )
    telemetry_logs = relationship(
        "TelemetryLog", back_populates="tank", cascade="all, delete-orphan"
    )
    quality_metrics = relationship(
        "QualityMetric", back_populates="tank", cascade="all, delete-orphan"
    )
    alerts = relationship("Alert", back_populates="tank", cascade="all, delete-orphan")


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(String, primary_key=True, default=lambda: f"sen_{uuid.uuid4().hex[:8]}")
    tank_id = Column(String, ForeignKey("tanks.id"), nullable=False)
    sensor_type = Column(
        String, nullable=False
    )  # level, flow, ph, turbidity, tds, rain_gauge
    hardware_id = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    tank = relationship("Tank", back_populates="sensors")
    telemetry_logs = relationship(
        "TelemetryLog", back_populates="sensor", cascade="all, delete-orphan"
    )


class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(
        String, primary_key=True, default=lambda: f"telem_{uuid.uuid4().hex[:8]}"
    )
    sensor_id = Column(String, ForeignKey("sensors.id"), nullable=True)
    tank_id = Column(String, ForeignKey("tanks.id"), nullable=False)
    timestamp = Column(DateTime, default=get_utc_now, nullable=False)
    water_level_liters = Column(Float, nullable=False)
    flow_rate_lpm = Column(Float, default=0.0, nullable=False)
    ph_level = Column(Float, nullable=True)
    turbidity_ntu = Column(Float, nullable=True)
    tds_ppm = Column(Float, nullable=True)
    precipitation_mm = Column(Float, default=0.0, nullable=True)
    head_pressure_psi = Column(Float, default=0.0, nullable=True)
    water_temp_c = Column(Float, default=20.0, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    sensor = relationship("Sensor", back_populates="telemetry_logs")
    tank = relationship("Tank", back_populates="telemetry_logs")


class QualityMetric(Base):
    __tablename__ = "quality_metrics"

    id = Column(String, primary_key=True, default=lambda: f"qm_{uuid.uuid4().hex[:8]}")
    tank_id = Column(String, ForeignKey("tanks.id"), nullable=False)
    ph_level = Column(Float, nullable=False)
    turbidity_ntu = Column(Float, nullable=False)
    tds_ppm = Column(Float, nullable=False)
    pass_status = Column(Boolean, default=True, nullable=False)
    backwash_scheduled = Column(Boolean, default=False, nullable=False)
    timestamp = Column(DateTime, default=get_utc_now, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    tank = relationship("Tank", back_populates="quality_metrics")


class YieldAnalytic(Base):
    __tablename__ = "yield_analytics"

    id = Column(
        String, primary_key=True, default=lambda: f"yield_{uuid.uuid4().hex[:8]}"
    )
    tank_id = Column(String, ForeignKey("tanks.id"), nullable=True)
    catchment_area_sqm = Column(Float, nullable=False)
    precipitation_mm = Column(Float, nullable=False)
    efficiency_factor = Column(Float, default=0.9, nullable=False)
    harvested_liters = Column(Float, nullable=False)
    recorded_date = Column(DateTime, default=get_utc_now, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=lambda: f"alt_{uuid.uuid4().hex[:8]}")
    tank_id = Column(String, ForeignKey("tanks.id"), nullable=True)
    severity = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL, WARNING
    category = Column(
        String, nullable=False
    )  # MAINTENANCE, QUALITY, OVERFLOW, HARDWARE, PUMP
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    tank = relationship("Tank", back_populates="alerts")


class BackwashLog(Base):
    __tablename__ = "backwash_logs"

    id = Column(String, primary_key=True, default=lambda: f"bw_{uuid.uuid4().hex[:8]}")
    tank_id = Column(String, ForeignKey("tanks.id"), nullable=False)
    unit_name = Column(String, default="Filtration Unit 1", nullable=False)
    status = Column(
        String, default="COMPLETED", nullable=False
    )  # IN_PROGRESS, COMPLETED, FAILED
    triggered_by = Column(
        String, default="AUTOMATED", nullable=False
    )  # AUTOMATED, MANUAL
    timestamp = Column(DateTime, default=get_utc_now, nullable=False)
    notes = Column(Text, nullable=True)
