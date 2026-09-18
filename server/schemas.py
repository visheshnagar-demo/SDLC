from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Supplier Schemas
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Flower Schemas
class FlowerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    species: Optional[str] = None
    color: Optional[str] = None
    price_per_stem: float = Field(
        ..., ge=0, description="Price per stem must be non-negative"
    )
    stock_quantity: int = Field(
        ..., ge=0, description="Stock quantity must be non-negative"
    )
    low_stock_threshold: int = Field(
        10, ge=0, description="Low stock threshold must be non-negative"
    )
    freshness_date: Optional[date] = None
    care_instructions: Optional[str] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None


class FlowerCreate(FlowerBase):
    pass


class FlowerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    species: Optional[str] = None
    color: Optional[str] = None
    price_per_stem: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    freshness_date: Optional[date] = None
    care_instructions: Optional[str] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None


class FlowerResponse(FlowerBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None
    supplier: Optional[SupplierResponse] = None

    model_config = ConfigDict(from_attributes=True)


# OrderItem Schemas
class OrderItemCreate(BaseModel):
    flower_id: str
    quantity: int = Field(..., ge=1, description="Quantity must be at least 1")
    unit_price: Optional[float] = Field(None, ge=0)


class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    flower_id: str
    quantity: int
    unit_price: float
    line_total: float
    flower: Optional[FlowerResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Order Schemas
class OrderCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(
        ..., min_items=1, description="Order must contain at least one item"
    )


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., min_length=1)


class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    status: str
    total_amount: float
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    order_items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Analytics Schemas
class TopSellingFlower(BaseModel):
    flower_id: str
    name: str
    species: Optional[str] = None
    total_sold: int
    revenue_generated: float


class DashboardAnalytics(BaseModel):
    total_revenue: float
    total_orders: int
    total_flowers_in_stock: int
    low_stock_count: int
    top_selling_flowers: List[TopSellingFlower] = []
