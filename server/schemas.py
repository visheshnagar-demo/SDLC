"""Pydantic schemas for request and response validation."""
from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


# --------------------- User & Auth Schemas ---------------------
class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: Optional[str] = "ATTENDEE"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


# --------------------- Event Schemas ---------------------
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    venue_name: str
    start_date: str
    end_date: str
    status: Optional[str] = "ACTIVE"


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    venue_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None


class EventResponse(EventBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --------------------- Pass Tier Schemas ---------------------
class PassTierBase(BaseModel):
    tier_name: str
    description: Optional[str] = None
    price: float
    total_quota: int
    available_quota: int
    valid_from: str
    valid_to: str


class PassTierCreate(PassTierBase):
    event_id: Optional[str] = None


class PassTierUpdate(BaseModel):
    price: Optional[float] = None
    total_quota: Optional[int] = None
    available_quota: Optional[int] = None
    tier_name: Optional[str] = None
    description: Optional[str] = None


class PassTierResponse(PassTierBase):
    id: str
    event_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --------------------- Booking & Pass Schemas ---------------------
class AttendeeInfo(BaseModel):
    fullName: str
    email: Optional[str] = None
    phone: Optional[str] = None


class BookingCreate(BaseModel):
    eventId: str
    passTierId: str
    quantity: int
    attendees: List[AttendeeInfo]


class PassResponse(BaseModel):
    id: str
    pass_number: str
    booking_id: str
    pass_tier_id: str
    attendee_name: str
    attendee_email: Optional[str] = None
    attendee_phone: Optional[str] = None
    qr_signature_hash: str
    qr_payload: str
    status: str
    entry_count: int
    max_entries: int
    last_scanned_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    id: str
    booking_reference: str
    user_id: str
    event_id: str
    total_amount: float
    booking_status: str
    created_at: datetime
    passes: List[PassResponse] = []

    class Config:
        from_attributes = True


# --------------------- Gate Validation Schemas ---------------------
class GateScanRequest(BaseModel):
    gateIdentifier: str
    qrPayload: str


class GateScanResponse(BaseModel):
    status: str  # VALID, ALREADY_USED, EXPIRED, INVALID_SIGNATURE
    message: str
    passId: Optional[str] = None
    passNumber: Optional[str] = None
    attendeeName: Optional[str] = None
    tierName: Optional[str] = None
    checkedInAt: Optional[str] = None
    firstCheckedInAt: Optional[str] = None
    entryCount: Optional[int] = None
    maxEntries: Optional[int] = None


# --------------------- Admin Analytics Schemas ---------------------
class GateMetric(BaseModel):
    gateIdentifier: str
    totalScans: int
    successfulScans: int
    blockedScans: int


class AdminAnalyticsResponse(BaseModel):
    totalPassesIssued: int
    totalCheckedIn: int
    scansPerMinute: float
    liveOccupancy: int
    grossRevenue: float
    gateMetrics: List[GateMetric] = []
