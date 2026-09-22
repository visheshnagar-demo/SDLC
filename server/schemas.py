from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# -------------------------------------------------------------
# Base & Generic Schemas
# -------------------------------------------------------------
class MessageResponse(BaseModel):
    detail: str


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str


# -------------------------------------------------------------
# User & Address Schemas
# -------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: Optional[str] = "customer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserAddressBase(BaseModel):
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str = "United States"
    is_default: bool = False


class UserAddressCreate(UserAddressBase):
    pass


class UserAddressResponse(UserAddressBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime
    addresses: List[UserAddressResponse] = []

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


# -------------------------------------------------------------
# Watch Schemas
# -------------------------------------------------------------
class WatchBase(BaseModel):
    brand: str
    model: str
    reference_number: str
    serial_number: str
    year_of_manufacture: int
    condition_score: float = Field(..., ge=1.0, le=10.0)
    condition_grade: str
    price: float = Field(..., gt=0)
    movement_type: str
    case_size_mm: float
    dial_color: str
    bezel_material: str
    strap_material: str
    box_included: bool = True
    papers_included: bool = True
    authentication_status: str = "VERIFIED"
    certificate_number: str
    authenticator_notes: Optional[str] = None
    image_urls: List[str] = []


class WatchCreateRequest(WatchBase):
    status: Optional[str] = "AVAILABLE"


class WatchUpdateRequest(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    reference_number: Optional[str] = None
    serial_number: Optional[str] = None
    year_of_manufacture: Optional[int] = None
    condition_score: Optional[float] = None
    condition_grade: Optional[str] = None
    price: Optional[float] = None
    movement_type: Optional[str] = None
    case_size_mm: Optional[float] = None
    dial_color: Optional[str] = None
    bezel_material: Optional[str] = None
    strap_material: Optional[str] = None
    box_included: Optional[bool] = None
    papers_included: Optional[bool] = None
    authentication_status: Optional[str] = None
    certificate_number: Optional[str] = None
    authenticator_notes: Optional[str] = None
    image_urls: Optional[List[str]] = None
    status: Optional[str] = None


class WatchResponse(WatchBase):
    id: str
    status: str
    reserved_by_user_id: Optional[str] = None
    hold_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WatchDetailResponse(WatchResponse):
    pass


class WatchListResponse(BaseModel):
    items: List[WatchResponse]
    total: int
    skip: int
    limit: int


# -------------------------------------------------------------
# Cart & Reservation Schemas
# -------------------------------------------------------------
class ReserveRequest(BaseModel):
    watch_id: str


class ReserveResponse(BaseModel):
    id: str
    user_id: str
    watch_id: str
    status: str
    reserved_at: datetime
    expires_at: datetime
    seconds_remaining: int
    watch: WatchResponse


class CartItemResponse(BaseModel):
    id: str
    user_id: str
    watch_id: str
    reserved_at: datetime
    expires_at: datetime
    seconds_remaining: int
    watch: WatchResponse

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# Order & Checkout Schemas
# -------------------------------------------------------------
class ShippingAddressInput(BaseModel):
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str = "United States"


class CheckoutRequest(BaseModel):
    watch_id: str
    shipping_address_id: Optional[str] = None
    shipping_address: Optional[ShippingAddressInput] = None
    shipping_tier: str = (
        "Malca-Amit Priority Secure"  # or "Ferrari Group Armored Express"
    )
    payment_token: Optional[str] = "tok_simulated_luxury_escrow"


class OrderStatusUpdateRequest(BaseModel):
    fulfillment_status: Optional[str] = None
    payment_status: Optional[str] = None
    tracking_number: Optional[str] = None
    courier_name: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    watch_id: str
    total_amount: float
    shipping_fee: float
    shipping_tier: str
    shipping_address_id: Optional[str] = None
    shipping_address: Optional[UserAddressResponse] = None
    payment_status: str
    fulfillment_status: str
    tracking_number: Optional[str] = None
    courier_name: Optional[str] = None
    handover_pin: Optional[str] = None
    certificate_url: Optional[str] = None
    watch: Optional[WatchResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    skip: int
    limit: int


# -------------------------------------------------------------
# Wishlist Schemas
# -------------------------------------------------------------
class WishlistToggleResponse(BaseModel):
    in_wishlist: bool
    watch_id: str
    message: str


class WishlistItemResponse(BaseModel):
    id: str
    user_id: str
    watch_id: str
    watch: WatchResponse
    created_at: datetime

    class Config:
        from_attributes = True
