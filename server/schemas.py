from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "devotee"


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Family Member Schemas
class FamilyMemberBase(BaseModel):
    full_name: str
    relationship: Optional[str] = None
    gotra: Optional[str] = None
    rashi: Optional[str] = None
    nakshatra: Optional[str] = None


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberResponse(FamilyMemberBase):
    id: str
    devotee_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Devotee Schemas
class DevoteeBase(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None


class DevoteeCreate(DevoteeBase):
    full_name: str
    email: Optional[str] = None


class DevoteeResponse(DevoteeBase):
    id: str
    user_id: Optional[str] = None
    devotee_number: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    family_members: List[FamilyMemberResponse] = []

    class Config:
        from_attributes = True


# Pooja Catalog Schemas
class PoojaCatalogBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    default_price: float = 0.0
    duration_minutes: int = 30
    max_capacity: int = 50


class PoojaCatalogCreate(PoojaCatalogBase):
    pass


class PoojaCatalogResponse(PoojaCatalogBase):
    id: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Pooja Slot Schemas
class PoojaSlotBase(BaseModel):
    slot_date: str
    start_time: str
    end_time: str
    capacity: int = 50


class PoojaSlotCreate(PoojaSlotBase):
    pooja_id: str
    priest_id: Optional[str] = None


class PoojaSlotResponse(PoojaSlotBase):
    id: str
    pooja_id: str
    priest_id: Optional[str] = None
    booked_count: int = 0
    status: str = "open"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Pooja Booking Schemas
class PoojaBookingCreate(BaseModel):
    slot_id: str
    devotee_id: Optional[str] = None
    sankalp_name: str
    sankalp_gotra: Optional[str] = None
    amount_paid: float = 0.0


class PoojaBookingResponse(BaseModel):
    id: str
    slot_id: str
    devotee_id: Optional[str] = None
    booking_number: str
    sankalp_name: str
    sankalp_gotra: Optional[str] = None
    amount_paid: float
    payment_status: str
    qr_code_token: str
    booking_status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QRVerifyRequest(BaseModel):
    qr_code_token: str


# Donation Schemas
class DonationCreate(BaseModel):
    devotee_id: Optional[str] = None
    fund_type: str  # annadanam, corpus, general_hundi, etc.
    amount: float
    payment_method: str = "upi"
    payment_ref: Optional[str] = None
    is_tax_exempt: bool = True


class DonationResponse(BaseModel):
    id: str
    devotee_id: Optional[str] = None
    receipt_number: str
    fund_type: str
    amount: float
    payment_method: str
    payment_ref: Optional[str] = None
    is_tax_exempt: bool
    tax_80g_ref: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Inventory Schemas
class InventoryItemBase(BaseModel):
    item_code: str
    item_name: str
    category: str
    unit_of_measure: str = "kg"
    current_stock: float = 0.0
    minimum_threshold: float = 10.0
    is_precious_asset: bool = False


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemResponse(InventoryItemBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryMovementCreate(BaseModel):
    item_id: str
    movement_type: str  # in, out, audit
    quantity: float
    unit_price: float = 0.0
    reference_reason: Optional[str] = None


class InventoryMovementResponse(BaseModel):
    id: str
    item_id: str
    movement_type: str
    quantity: float
    unit_price: float
    reference_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Finance & Shift Schemas
class ShiftOpenRequest(BaseModel):
    counter_number: str = "Counter-1"
    opening_cash: float = 0.0


class ShiftCloseRequest(BaseModel):
    closing_cash_actual: float


class ShiftResponse(BaseModel):
    id: str
    cashier_id: str
    counter_number: str
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    opening_cash: float
    closing_cash_actual: Optional[float] = None
    system_calculated: float
    variance: float
    status: str

    class Config:
        from_attributes = True


class DailyReportResponse(BaseModel):
    date: str
    total_donations: float
    total_pooja_bookings: float
    total_revenue: float
    fund_breakdown: dict
    payment_method_breakdown: dict


class AuditLogResponse(BaseModel):
    id: str
    action: str
    user_id: Optional[str] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
