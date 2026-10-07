from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==================== User / Auth Schemas ====================
class UserBase(BaseModel):
    email: EmailStr
    role: str = "staff"
    is_active: bool = True
    is_verified: bool = True


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== Room Schemas ====================
class RoomBase(BaseModel):
    room_number: str
    room_category: str = "Standard"  # Standard, Deluxe, Suite
    base_rate_per_night: float = Field(..., gt=0)
    floor_number: int = 1
    max_occupancy: int = 2
    amenities: List[str] = []


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_category: Optional[str] = None
    base_rate_per_night: Optional[float] = Field(None, gt=0)
    floor_number: Optional[int] = None
    max_occupancy: Optional[int] = None
    amenities: Optional[List[str]] = None
    status: Optional[str] = None


class RoomStatusUpdate(BaseModel):
    status: str  # Available, Occupied, Under Maintenance, Reserved


class RoomResponse(BaseModel):
    id: str
    room_number: str
    room_category: str
    base_rate_per_night: float
    status: str
    floor_number: int
    max_occupancy: int
    amenities: List[str] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== Guest Schemas ====================
class GuestBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    id_proof_type: str = "Passport"
    id_proof_number: str
    address: Optional[str] = None
    vip_status: bool = False


class GuestCreate(GuestBase):
    pass


class GuestUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    address: Optional[str] = None
    vip_status: Optional[bool] = None


class GuestResponse(GuestBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== Booking Schemas ====================
class BookingCreate(BaseModel):
    guest_id: str
    room_id: str
    check_in_date: str  # YYYY-MM-DD
    check_out_date: str  # YYYY-MM-DD
    special_requests: Optional[str] = None


class BookingUpdate(BaseModel):
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    special_requests: Optional[str] = None
    booking_status: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    booking_reference: str
    room_id: str
    guest_id: str
    check_in_date: str
    check_out_date: str
    total_nights: int
    total_amount: float
    booking_status: str
    actual_check_in: Optional[datetime] = None
    actual_check_out: Optional[datetime] = None
    special_requests: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    room: Optional[RoomResponse] = None
    guest: Optional[GuestResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ==================== Invoice Schemas ====================
class InvoiceItemBase(BaseModel):
    description: str
    item_type: str = "Service"  # RoomFee, Service, Amenity, Dining, Spa
    unit_price: float
    quantity: int = 1


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: str
    invoice_id: str
    total_price: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaymentRequest(BaseModel):
    payment_method: str = "CreditCard"  # CreditCard, DebitCard, Cash, BankTransfer


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    booking_id: str
    guest_id: str
    room_charges: float
    service_charges: float
    tax_amount: float
    total_payable: float
    payment_status: str
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItemResponse] = []
    booking: Optional[BookingResponse] = None
    guest: Optional[GuestResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ==================== Analytics Schemas ====================
class AnalyticsDashboardResponse(BaseModel):
    occupancy_rate_percentage: float
    total_rooms: int
    occupied_rooms: int
    available_rooms: int
    maintenance_rooms: int
    today_revenue: float
    pending_check_ins_today: int
    pending_check_outs_today: int
