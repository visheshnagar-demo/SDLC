import re
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


# ---------------- Auth & User Schemas ----------------


class UserBase(BaseModel):
    email: str = Field(..., description="User email address")
    full_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v) or ".." in v or " " in v:
            raise ValueError("Invalid email address format")
        return v


class UserCreate(UserBase):
    password: str = Field(
        ..., min_length=6, description="User password (min 6 characters)"
    )


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


# ---------------- Product Schemas ----------------


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    brand: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    purchase_date: date
    serial_number: Optional[str] = None
    purchase_price: float = Field(0.0, ge=0.0)
    vendor: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("purchase_date")
    @classmethod
    def validate_purchase_date_not_in_future(cls, v: date) -> date:
        today = date.today()
        if v > today:
            raise ValueError("Purchase date cannot be in the future")
        return v


class ProductCreate(ProductBase):
    # Optional auto-creation of warranty at product registration time
    coverage_duration_months: Optional[int] = Field(
        None, ge=0, description="Warranty duration in months (0 for lifetime)"
    )
    coverage_type: Optional[str] = Field(
        "Standard", description="e.g. Manufacturer, Extended, Lifetime"
    )
    provider_name: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    brand: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    purchase_date: Optional[date] = None
    serial_number: Optional[str] = None
    purchase_price: Optional[float] = Field(None, ge=0.0)
    vendor: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("purchase_date")
    @classmethod
    def validate_purchase_date_not_in_future(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("Purchase date cannot be in the future")
        return v


class WarrantyBrief(BaseModel):
    id: str
    coverage_duration_months: int
    start_date: date
    expiration_date: Optional[date] = None
    coverage_type: str
    provider_name: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(ProductBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    warranties: List[WarrantyBrief] = []

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    skip: int
    limit: int


# ---------------- Warranty Schemas ----------------


class WarrantyBase(BaseModel):
    product_id: str
    coverage_duration_months: int = Field(
        12, ge=0, description="Duration in months. 0 implies Lifetime."
    )
    start_date: Optional[date] = None
    coverage_type: str = Field(
        "Standard", description="Standard, Manufacturer, Extended, Lifetime, Accidental"
    )
    provider_name: Optional[str] = None
    notes: Optional[str] = None


class WarrantyCreate(WarrantyBase):
    pass


class WarrantyUpdate(BaseModel):
    coverage_duration_months: Optional[int] = Field(None, ge=0)
    start_date: Optional[date] = None
    expiration_date: Optional[date] = None
    coverage_type: Optional[str] = None
    provider_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class WarrantyResponse(BaseModel):
    id: str
    product_id: str
    coverage_duration_months: int
    start_date: date
    expiration_date: Optional[date] = None
    coverage_type: str
    provider_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    product_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WarrantyListResponse(BaseModel):
    items: List[WarrantyResponse]
    total: int
    skip: int
    limit: int


# ---------------- Document Schemas ----------------


class DocumentResponse(BaseModel):
    id: str
    product_id: str
    filename: str
    file_size: int
    mime_type: str
    document_type: str
    download_url: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int


# ---------------- Claim Schemas ----------------


class ClaimBase(BaseModel):
    product_id: str
    claim_date: date
    issue_description: str = Field(..., min_length=1)
    status: str = Field(
        "Pending", description="Pending, In Progress, Approved, Resolved, Rejected"
    )
    service_center: Optional[str] = None
    repair_cost: float = Field(0.0, ge=0.0)
    resolution_notes: Optional[str] = None


class ClaimCreate(ClaimBase):
    pass


class ClaimUpdate(BaseModel):
    claim_date: Optional[date] = None
    issue_description: Optional[str] = None
    status: Optional[str] = None
    service_center: Optional[str] = None
    repair_cost: Optional[float] = Field(None, ge=0.0)
    resolution_notes: Optional[str] = None


class ClaimResponse(ClaimBase):
    id: str
    created_at: datetime
    updated_at: datetime
    product_name: Optional[str] = None
    warning: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ClaimListResponse(BaseModel):
    items: List[ClaimResponse]
    total: int
    skip: int
    limit: int


# ---------------- Alert & Dashboard Schemas ----------------


class ExpirationAlert(BaseModel):
    warranty_id: str
    product_id: str
    product_name: str
    brand: str
    category: str
    expiration_date: Optional[date] = None
    days_remaining: int
    coverage_type: str
    status: str


class AlertListResponse(BaseModel):
    items: List[ExpirationAlert]
    total: int


class DashboardStatsResponse(BaseModel):
    total_products: int
    active_warranties: int
    expiring_soon_count: int
    expired_warranties: int
    total_claim_costs: float
    total_claims: int
