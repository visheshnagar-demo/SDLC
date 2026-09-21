from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class CartItem(BaseModel):
    name: str
    quantity: int = 1
    unit_price: float


class CheckoutSessionRequest(BaseModel):
    amount: float = Field(gt=0, description="Amount in base currency")
    currency: str = Field(default="USD", description="Settlement/target currency")
    customer_email: str
    items: Optional[List[CartItem]] = Field(default_factory=list)


class CheckoutSessionResponse(BaseModel):
    session_id: str
    payment_intent_id: str
    client_secret: str
    base_amount: float
    base_currency: str
    target_amount: float
    target_currency: str
    exchange_rate: float


class DigitalWalletPaymentRequest(BaseModel):
    wallet_type: str = Field(description="apple_pay or google_pay")
    payment_token: str
    currency: str = "USD"
    amount: float = Field(gt=0)
    customer_email: Optional[str] = "customer@example.com"


class DigitalWalletPaymentResponse(BaseModel):
    transaction_id: str
    payment_intent_id: str
    wallet_type: str
    amount: float
    currency: str
    status: str


class ExchangeRatesResponse(BaseModel):
    base_currency: str
    rates: dict[str, float]
    timestamp: str


class RefundRequest(BaseModel):
    transaction_id: str
    amount: float = Field(gt=0)
    reason: str
    memo: Optional[str] = None


class RefundSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: str
    refund_amount: float
    currency: str
    reason: str
    memo: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None


class TransactionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: str
    customer_email: str
    payment_method: str
    amount: float
    currency: str
    status: str
    created_at: Optional[datetime] = None


class TransactionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: str
    customer_email: str
    payment_method: str
    amount: float
    base_currency: str
    target_currency: str
    converted_amount: float
    exchange_rate: float
    status: str
    refunded_amount: float
    remaining_refundable_balance: float
    refunds: List[RefundSummary] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: Optional[str] = None
    event_type: str
    ip_address: str
    masked_payload: dict[str, Any]
    created_at: Optional[datetime] = None


# Rainwater Harvesting Management System Schemas


class TankCreate(BaseModel):
    name: str
    location: str
    total_capacity_liters: float = Field(
        gt=0, description="Total tank volume capacity in liters"
    )
    current_volume_liters: Optional[float] = Field(
        default=0.0, ge=0, description="Initial water volume in liters"
    )


class TankUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    total_capacity_liters: Optional[float] = Field(default=None, gt=0)
    current_volume_liters: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = None


class TankResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    location: str
    total_capacity_liters: float
    current_volume_liters: float
    fill_percentage: float = 0.0
    net_inflow_rate_lpm: float = 0.0
    net_outflow_rate_lpm: float = 0.0
    status: str
    supply_pump_active: bool = False
    overflow_valve_open: bool = False
    municipal_backup_active: bool = False
    clean_valve_open: bool = True
    pump_operating_hours: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TankStatusResponse(BaseModel):
    tank_id: str
    name: str
    total_capacity_liters: float
    current_volume_liters: float
    fill_percentage: float
    net_inflow_rate_lpm: float
    net_outflow_rate_lpm: float
    status: str
    head_pressure_psi: float = 0.0
    water_temp_c: float = 20.0
    ph_level: float = 7.2
    turbidity_ntu: float = 1.0
    tds_ppm: float = 120.0
    supply_pump_active: bool
    overflow_valve_open: bool
    municipal_backup_active: bool
    clean_valve_open: bool
    pump_operating_hours: float


class TelemetryIngest(BaseModel):
    sensor_id: Optional[str] = None
    tank_id: str
    timestamp: Optional[datetime] = None
    water_level_liters: float = Field(ge=0)
    flow_rate_lpm: float = Field(default=0.0)
    ph_level: Optional[float] = Field(default=7.2, ge=0, le=14)
    turbidity_ntu: Optional[float] = Field(default=1.0, ge=0)
    tds_ppm: Optional[float] = Field(default=120.0, ge=0)
    precipitation_mm: Optional[float] = Field(default=0.0, ge=0)
    catchment_area_sqm: Optional[float] = Field(default=500.0, ge=0)
    head_pressure_psi: Optional[float] = Field(default=35.0)
    water_temp_c: Optional[float] = Field(default=18.5)


class TelemetryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sensor_id: Optional[str] = None
    tank_id: str
    timestamp: datetime
    water_level_liters: float
    flow_rate_lpm: float
    ph_level: Optional[float] = None
    turbidity_ntu: Optional[float] = None
    tds_ppm: Optional[float] = None
    precipitation_mm: Optional[float] = None
    head_pressure_psi: Optional[float] = None
    water_temp_c: Optional[float] = None
    created_at: Optional[datetime] = None


class QualityMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tank_id: str
    ph_level: float
    turbidity_ntu: float
    tds_ppm: float
    pass_status: bool
    backwash_scheduled: bool
    timestamp: datetime


class BackwashRequest(BaseModel):
    tank_id: str
    unit_name: Optional[str] = "Filtration Unit 1"
    triggered_by: Optional[str] = "MANUAL"
    notes: Optional[str] = None


class BackwashResponse(BaseModel):
    id: str
    tank_id: str
    unit_name: str
    status: str
    triggered_by: str
    timestamp: datetime
    message: str


class QualityOverviewResponse(BaseModel):
    average_ph: float
    average_turbidity_ntu: float
    average_tds_ppm: float
    overall_pass_status: bool
    active_filtration_units: int
    recent_backwashes_count: int
    metrics: List[QualityMetricResponse]
    recent_backwash_logs: List[dict]


class YieldCalculateRequest(BaseModel):
    catchment_area_sqm: float = Field(
        gt=0, description="Catchment area in square meters"
    )
    precipitation_mm: float = Field(
        ge=0, description="Precipitation depth in millimeters"
    )
    efficiency_factor: Optional[float] = Field(
        default=0.9, ge=0.0, le=1.0, description="Runoff efficiency coefficient"
    )


class YieldCalculateResponse(BaseModel):
    catchment_area_sqm: float
    precipitation_mm: float
    efficiency_factor: float
    estimated_harvested_liters: float
    formula: str = (
        "harvested_liters = catchment_area_sqm * precipitation_mm * efficiency_factor"
    )


class YieldAnalyticResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tank_id: Optional[str] = None
    catchment_area_sqm: float
    precipitation_mm: float
    efficiency_factor: float
    harvested_liters: float
    recorded_date: datetime


class AlertCreate(BaseModel):
    tank_id: Optional[str] = None
    severity: str = Field(description="LOW, MEDIUM, HIGH, CRITICAL, or WARNING")
    category: str = Field(
        description="MAINTENANCE, QUALITY, OVERFLOW, HARDWARE, or PUMP"
    )
    message: str


class AlertAcknowledgeRequest(BaseModel):
    is_acknowledged: bool = True


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tank_id: Optional[str] = None
    severity: str
    category: str
    message: str
    is_acknowledged: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
