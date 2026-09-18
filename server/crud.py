import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from fastapi import HTTPException, status

from server import models, schemas


# Supplier CRUD
def get_supplier(db: Session, supplier_id: str) -> Optional[models.Supplier]:
    return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()


def get_suppliers(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Supplier]:
    return db.query(models.Supplier).offset(skip).limit(limit).all()


def create_supplier(db: Session, supplier: schemas.SupplierCreate) -> models.Supplier:
    db_supplier = models.Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def update_supplier(
    db: Session, supplier_id: str, supplier_update: schemas.SupplierUpdate
) -> Optional[models.Supplier]:
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return None
    update_data = supplier_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    db_supplier.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def delete_supplier(db: Session, supplier_id: str) -> bool:
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return False
    db.delete(db_supplier)
    db.commit()
    return True


# Category CRUD
def get_category(db: Session, category_id: str) -> Optional[models.Category]:
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def get_categories(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Category]:
    return db.query(models.Category).offset(skip).limit(limit).all()


def create_category(db: Session, category: schemas.CategoryCreate) -> models.Category:
    existing = (
        db.query(models.Category).filter(models.Category.name == category.name).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category.name}' already exists.",
        )
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(
    db: Session, category_id: str, category_update: schemas.CategoryUpdate
) -> Optional[models.Category]:
    db_category = get_category(db, category_id)
    if not db_category:
        return None
    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    db_category.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: str) -> bool:
    db_category = get_category(db, category_id)
    if not db_category:
        return False
    db.delete(db_category)
    db.commit()
    return True


# Flower CRUD
def get_flower(db: Session, flower_id: str) -> Optional[models.Flower]:
    return db.query(models.Flower).filter(models.Flower.id == flower_id).first()


def get_flowers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    low_stock_only: bool = False,
) -> List[models.Flower]:
    query = db.query(models.Flower)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Flower.name.ilike(pattern),
                models.Flower.species.ilike(pattern),
                models.Flower.color.ilike(pattern),
            )
        )
    if category_id:
        query = query.filter(models.Flower.category_id == category_id)
    if supplier_id:
        query = query.filter(models.Flower.supplier_id == supplier_id)
    if low_stock_only:
        # Stock threshold <= low_stock_threshold and low_stock_threshold > 0
        query = query.filter(
            models.Flower.stock_quantity <= models.Flower.low_stock_threshold,
            models.Flower.low_stock_threshold > 0,
        )
    return query.offset(skip).limit(limit).all()


def create_flower(db: Session, flower: schemas.FlowerCreate) -> models.Flower:
    if (
        flower.price_per_stem < 0
        or flower.stock_quantity < 0
        or flower.low_stock_threshold < 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price, stock quantity, and threshold must be non-negative.",
        )
    db_flower = models.Flower(**flower.model_dump())
    db.add(db_flower)
    db.commit()
    db.refresh(db_flower)
    return db_flower


def update_flower(
    db: Session, flower_id: str, flower_update: schemas.FlowerUpdate
) -> Optional[models.Flower]:
    db_flower = get_flower(db, flower_id)
    if not db_flower:
        return None

    update_data = flower_update.model_dump(exclude_unset=True)

    # Validate negative values
    if "price_per_stem" in update_data and update_data["price_per_stem"] < 0:
        raise HTTPException(status_code=400, detail="Price per stem cannot be negative")
    if "stock_quantity" in update_data and update_data["stock_quantity"] < 0:
        raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")
    if "low_stock_threshold" in update_data and update_data["low_stock_threshold"] < 0:
        raise HTTPException(
            status_code=400, detail="Low stock threshold cannot be negative"
        )

    for key, value in update_data.items():
        setattr(db_flower, key, value)
    db_flower.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_flower)
    return db_flower


def delete_flower(db: Session, flower_id: str) -> bool:
    db_flower = get_flower(db, flower_id)
    if not db_flower:
        return False
    db.delete(db_flower)
    db.commit()
    return True


# Order CRUD
def get_order(db: Session, order_id: str) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_orders(
    db: Session, skip: int = 0, limit: int = 100, status_filter: Optional[str] = None
) -> List[models.Order]:
    query = db.query(models.Order)
    if status_filter:
        query = query.filter(models.Order.status == status_filter)
    return query.order_by(desc(models.Order.created_at)).offset(skip).limit(limit).all()


def create_order(db: Session, order_data: schemas.OrderCreate) -> models.Order:
    # Validate item availability first
    items_to_create = []
    total_amount = 0.0

    for item in order_data.items:
        flower = get_flower(db, item.flower_id)
        if not flower:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flower with ID '{item.flower_id}' not found.",
            )
        if flower.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient Stock for '{flower.name}'. Available: {flower.stock_quantity}, requested: {item.quantity}.",
            )

        unit_price = (
            item.unit_price if item.unit_price is not None else flower.price_per_stem
        )
        subtotal = unit_price * item.quantity
        total_amount += subtotal

        items_to_create.append(
            {
                "flower": flower,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "subtotal": subtotal,
            }
        )

    # Generate order number
    order_number = (
        f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    )

    db_order = models.Order(
        order_number=order_number,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        notes=order_data.notes,
        status="Pending",
        total_amount=total_amount,
    )
    db.add(db_order)
    db.flush()

    for item_info in items_to_create:
        flower = item_info["flower"]
        # Deduct inventory stock automatically upon order confirmation
        flower.stock_quantity -= item_info["quantity"]
        flower.updated_at = datetime.utcnow()

        db_order_item = models.OrderItem(
            order_id=db_order.id,
            flower_id=flower.id,
            quantity=item_info["quantity"],
            unit_price=item_info["unit_price"],
            subtotal=item_info["subtotal"],
        )
        db.add(db_order_item)

    db.commit()
    db.refresh(db_order)
    return db_order


def update_order_status(
    db: Session, order_id: str, new_status: str
) -> Optional[models.Order]:
    db_order = get_order(db, order_id)
    if not db_order:
        return None

    # If order is being cancelled, restore stock if it was not already cancelled
    if new_status == "Cancelled" and db_order.status != "Cancelled":
        for item in db_order.items:
            flower = get_flower(db, item.flower_id)
            if flower:
                flower.stock_quantity += item.quantity
                flower.updated_at = datetime.utcnow()

    db_order.status = new_status
    db_order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_order)
    return db_order


# Analytics
def get_dashboard_analytics(db: Session) -> schemas.DashboardAnalyticsResponse:
    total_species = db.query(models.Flower).count()

    total_stock_res = db.query(func.sum(models.Flower.stock_quantity)).scalar()
    total_stock = total_stock_res if total_stock_res else 0

    # Low stock items: threshold > 0 and stock <= threshold
    low_stock_query = db.query(models.Flower).filter(
        models.Flower.stock_quantity <= models.Flower.low_stock_threshold,
        models.Flower.low_stock_threshold > 0,
    )
    low_stock_count = low_stock_query.count()
    low_stock_flowers = low_stock_query.all()

    # Daily revenue: sum of total_amount for non-cancelled orders created today
    today_start = datetime.combine(date.today(), datetime.min.time())
    daily_rev_res = (
        db.query(func.sum(models.Order.total_amount))
        .filter(
            models.Order.created_at >= today_start, models.Order.status != "Cancelled"
        )
        .scalar()
    )
    daily_revenue = float(daily_rev_res) if daily_rev_res else 0.0

    # Top selling flowers (top 3)
    top_selling_raw = (
        db.query(
            models.OrderItem.flower_id,
            func.sum(models.OrderItem.quantity).label("total_qty"),
            func.sum(models.OrderItem.subtotal).label("total_rev"),
        )
        .join(models.Order, models.Order.id == models.OrderItem.order_id)
        .filter(models.Order.status != "Cancelled")
        .group_by(models.OrderItem.flower_id)
        .order_by(desc("total_qty"))
        .limit(3)
        .all()
    )

    top_selling_flowers = []
    for f_id, qty, rev in top_selling_raw:
        fl = get_flower(db, f_id)
        fl_name = fl.name if fl else "Unknown"
        top_selling_flowers.append(
            schemas.TopSellingFlower(
                flower_id=f_id,
                flower_name=fl_name,
                total_quantity_sold=int(qty),
                total_revenue=float(rev),
            )
        )

    # Category breakdown
    category_counts = (
        db.query(
            models.Category.id,
            models.Category.name,
            func.count(models.Flower.id).label("f_count"),
        )
        .outerjoin(models.Flower, models.Flower.category_id == models.Category.id)
        .group_by(models.Category.id, models.Category.name)
        .all()
    )

    category_breakdown = [
        schemas.CategoryPopularity(
            category_id=cat_id, category_name=cat_name, flower_count=int(cnt)
        )
        for cat_id, cat_name, cnt in category_counts
    ]

    # Convert low stock flowers to schemas
    low_stock_alerts = [
        schemas.FlowerResponse.model_validate(f) for f in low_stock_flowers
    ]

    return schemas.DashboardAnalyticsResponse(
        total_species=total_species,
        total_stock=total_stock,
        low_stock_count=low_stock_count,
        daily_revenue=daily_revenue,
        top_selling_flowers=top_selling_flowers,
        category_breakdown=category_breakdown,
        low_stock_alerts=low_stock_alerts,
    )
