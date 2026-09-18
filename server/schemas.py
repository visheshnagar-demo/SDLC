from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


# --- CATEGORY SCHEMAS ---
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- SUPPLIER SCHEMAS ---
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- FLOWER SCHEMAS ---
class FlowerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    species: str = Field(..., min_length=1, max_length=150)
    color: str = Field(..., min_length=1, max_length=50)
    price_per_stem: float = Field(
        ..., ge=0.0, description="Price per stem must be non-negative"
    )
    stock_quantity: int = Field(
        ..., ge=0, description="Stock quantity must be non-negative"
    )
    low_stock_threshold: int = Field(
        20, ge=0, description="Low stock threshold must be non-negative"
    )
    freshness_date: Optional[date] = None
    care_instructions: Optional[str] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None


class FlowerCreate(FlowerBase):
    pass


class FlowerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    species: Optional[str] = Field(None, min_length=1)
    color: Optional[str] = Field(None, min_length=1)
    price_per_stem: Optional[float] = Field(None, ge=0.0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    freshness_date: Optional[date] = None
    care_instructions: Optional[str] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None


class FlowerResponse(FlowerBase):
    id: str
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    supplier: Optional[SupplierResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- ORDER ITEM SCHEMAS ---
class OrderItemCreate(BaseModel):
    flower_id: str
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")


class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    flower_id: str
    quantity: int
    unit_price: float
    subtotal: float
    flower_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1)
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[OrderItemCreate] = Field(
        ..., min_items=1, description="Order must contain at least one item"
    )
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Pending|Processing|Completed|Cancelled)$")


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

    model_config = ConfigDict(from_attributes=True)


# --- ALERT SCHEMAS ---
class StockAlert(BaseModel):
    flower_id: str
    flower_name: str
    species: str
    current_stock: int
    low_stock_threshold: int
    alert_level: str
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None


# --- DASHBOARD & ANALYTICS SCHEMAS ---
class TopSellingFlower(BaseModel):
    id: str
    name: str
    species: str
    quantity_sold: int
    total_revenue: float


class TopSellingCategory(BaseModel):
    id: Optional[str] = None
    name: str
    quantity_sold: int
    total_revenue: float


class DashboardAnalytics(BaseModel):
    total_flowers: int
    total_species: int
    total_stock: int
    low_stock_count: int
    total_orders: int
    total_revenue: float
    daily_revenue: float
    top_selling_flowers: List[TopSellingFlower] = []
    top_selling_categories: List[TopSellingCategory] = []
    low_stock_items: List[FlowerResponse] = []
    stock_alerts: List[StockAlert] = []
    recent_orders: List[OrderResponse] = []
