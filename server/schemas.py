from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# Supplier Schemas
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, description="Supplier company name")
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Flower Schemas
class FlowerBase(BaseModel):
    name: str = Field(..., min_length=1)
    species: str = Field(..., min_length=1)
    color: Optional[str] = None
    price_per_stem: float = Field(
        ..., ge=0, description="Price per stem must be non-negative"
    )
    stock_quantity: int = Field(
        0, ge=0, description="Stock quantity must be non-negative"
    )
    low_stock_threshold: int = Field(20, ge=0, description="Low stock alert threshold")
    freshness_date: Optional[str] = None
    care_instructions: Optional[str] = None
    supplier_id: Optional[str] = None
    category_id: Optional[str] = None


class FlowerCreate(FlowerBase):
    pass


class FlowerUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    color: Optional[str] = None
    price_per_stem: Optional[float] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    freshness_date: Optional[str] = None
    care_instructions: Optional[str] = None
    supplier_id: Optional[str] = None
    category_id: Optional[str] = None

    @field_validator("price_per_stem")
    def validate_price(cls, v):
        if v is not None and v < 0:
            raise ValueError("Price per stem cannot be negative")
        return v

    @field_validator("stock_quantity")
    def validate_stock(cls, v):
        if v is not None and v < 0:
            raise ValueError("Stock quantity cannot be negative")
        return v

    @field_validator("low_stock_threshold")
    def validate_threshold(cls, v):
        if v is not None and v < 0:
            raise ValueError("Low stock threshold cannot be negative")
        return v


class FlowerResponse(FlowerBase):
    id: str
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierResponse] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True


# Order Item Schemas
class OrderItemCreate(BaseModel):
    flower_id: str
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")
    unit_price: Optional[float] = Field(None, ge=0)


class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    flower_id: str
    quantity: int
    unit_price: float
    subtotal: float
    flower_name: Optional[str] = None

    class Config:
        from_attributes = True


# Order Schemas
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1)
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_items=1)


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ..., description="Order status: Pending, Processing, Completed, Cancelled"
    )

    @field_validator("status")
    def validate_status(cls, v):
        valid_statuses = ["Pending", "Processing", "Completed", "Cancelled"]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return v


class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    status: str
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# Dashboard & Analytics Schemas
class TopSellingFlower(BaseModel):
    flower_id: str
    flower_name: str
    total_quantity_sold: int
    total_revenue: float


class CategoryPopularity(BaseModel):
    category_id: Optional[str] = None
    category_name: str
    flower_count: int


class DashboardAnalyticsResponse(BaseModel):
    total_species: int
    total_stock: int
    low_stock_count: int
    daily_revenue: float
    top_selling_flowers: List[TopSellingFlower]
    category_breakdown: List[CategoryPopularity]
    low_stock_alerts: List[FlowerResponse]
