import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_, desc

from server import models, schemas


# --- CATEGORY CRUD ---
def get_categories(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Category]:
    return db.query(models.Category).offset(skip).limit(limit).all()


def get_category(db: Session, category_id: str) -> Optional[models.Category]:
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def get_category_by_name(db: Session, name: str) -> Optional[models.Category]:
    return db.query(models.Category).filter(models.Category.name == name).first()


def create_category(db: Session, category: schemas.CategoryCreate) -> models.Category:
    db_category = models.Category(
        id=str(uuid.uuid4()), name=category.name, description=category.description
    )
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
    for field, value in update_data.items():
        setattr(db_category, field, value)
    db_category.updated_at = datetime.now(timezone.utc)
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


# --- SUPPLIER CRUD ---
def get_suppliers(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Supplier]:
    return db.query(models.Supplier).offset(skip).limit(limit).all()


def get_supplier(db: Session, supplier_id: str) -> Optional[models.Supplier]:
    return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()


def create_supplier(db: Session, supplier: schemas.SupplierCreate) -> models.Supplier:
    db_supplier = models.Supplier(
        id=str(uuid.uuid4()),
        name=supplier.name,
        contact_person=supplier.contact_person,
        email=supplier.email,
        phone=supplier.phone,
        address=supplier.address,
    )
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
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    db_supplier.updated_at = datetime.now(timezone.utc)
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


# --- FLOWER CRUD ---
def get_flowers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False,
) -> List[models.Flower]:
    query = db.query(models.Flower).options(
        joinedload(models.Flower.category), joinedload(models.Flower.supplier)
    )

    if category_id:
        query = query.filter(models.Flower.category_id == category_id)
    if supplier_id:
        query = query.filter(models.Flower.supplier_id == supplier_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Flower.name.ilike(search_pattern),
                models.Flower.species.ilike(search_pattern),
                models.Flower.color.ilike(search_pattern),
            )
        )
    if low_stock_only:
        query = query.filter(
            and_(
                models.Flower.low_stock_threshold > 0,
                models.Flower.stock_quantity <= models.Flower.low_stock_threshold,
            )
        )

    return query.offset(skip).limit(limit).all()


def get_flower(db: Session, flower_id: str) -> Optional[models.Flower]:
    return (
        db.query(models.Flower)
        .options(joinedload(models.Flower.category), joinedload(models.Flower.supplier))
        .filter(models.Flower.id == flower_id)
        .first()
    )


def create_flower(db: Session, flower: schemas.FlowerCreate) -> models.Flower:
    if flower.price_per_stem < 0:
        raise ValueError("Price per stem cannot be negative")
    if flower.stock_quantity < 0:
        raise ValueError("Stock quantity cannot be negative")

    db_flower = models.Flower(
        id=str(uuid.uuid4()),
        name=flower.name,
        species=flower.species,
        color=flower.color,
        price_per_stem=flower.price_per_stem,
        stock_quantity=flower.stock_quantity,
        low_stock_threshold=flower.low_stock_threshold,
        freshness_date=flower.freshness_date,
        care_instructions=flower.care_instructions,
        category_id=flower.category_id,
        supplier_id=flower.supplier_id,
    )
    db.add(db_flower)
    db.commit()
    db.refresh(db_flower)
    return get_flower(db, db_flower.id)


def update_flower(
    db: Session, flower_id: str, flower_update: schemas.FlowerUpdate
) -> Optional[models.Flower]:
    db_flower = get_flower(db, flower_id)
    if not db_flower:
        return None

    update_data = flower_update.model_dump(exclude_unset=True)
    if "price_per_stem" in update_data and update_data["price_per_stem"] < 0:
        raise ValueError("Price per stem cannot be negative")
    if "stock_quantity" in update_data and update_data["stock_quantity"] < 0:
        raise ValueError("Stock quantity cannot be negative")

    for field, value in update_data.items():
        setattr(db_flower, field, value)

    db_flower.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_flower)
    return get_flower(db, db_flower.id)


def delete_flower(db: Session, flower_id: str) -> bool:
    db_flower = get_flower(db, flower_id)
    if not db_flower:
        return False
    db.delete(db_flower)
    db.commit()
    return True


# --- ORDER CRUD ---
def get_orders(
    db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None
) -> List[models.Order]:
    query = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.flower)
    )
    if status:
        query = query.filter(models.Order.status == status)
    return query.order_by(desc(models.Order.created_at)).offset(skip).limit(limit).all()


def get_order(db: Session, order_id: str) -> Optional[models.Order]:
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.flower))
        .filter(models.Order.id == order_id)
        .first()
    )


def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    # Validate stock and calculate totals
    items_to_create = []
    total_amount = 0.0

    for item in order_in.items:
        flower = (
            db.query(models.Flower).filter(models.Flower.id == item.flower_id).first()
        )
        if not flower:
            raise ValueError(f"Flower with ID '{item.flower_id}' not found")
        if item.quantity > flower.stock_quantity:
            raise ValueError(
                f"Insufficient Stock: Requested {item.quantity} units for '{flower.name}', but only {flower.stock_quantity} available."
            )

        unit_price = flower.price_per_stem
        subtotal = round(unit_price * item.quantity, 2)
        total_amount += subtotal

        # Store information for creation and stock deduction
        items_to_create.append(
            {
                "flower": flower,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "subtotal": subtotal,
            }
        )

    # Generate unique order number
    count = db.query(models.Order).count() + 1
    order_number = f"ORD-{count:04d}"

    db_order = models.Order(
        id=str(uuid.uuid4()),
        order_number=order_number,
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        status="Pending",
        total_amount=round(total_amount, 2),
        notes=order_in.notes,
    )
    db.add(db_order)
    db.flush()

    for item_data in items_to_create:
        flower = item_data["flower"]
        # Deduct stock automatically
        flower.stock_quantity -= item_data["quantity"]

        db_item = models.OrderItem(
            id=str(uuid.uuid4()),
            order_id=db_order.id,
            flower_id=flower.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    return get_order(db, db_order.id)


def update_order_status(
    db: Session, order_id: str, new_status: str
) -> Optional[models.Order]:
    db_order = get_order(db, order_id)
    if not db_order:
        return None

    # If cancelling an active order, restore stock
    if new_status == "Cancelled" and db_order.status != "Cancelled":
        for item in db_order.items:
            flower = (
                db.query(models.Flower)
                .filter(models.Flower.id == item.flower_id)
                .first()
            )
            if flower:
                flower.stock_quantity += item.quantity

    db_order.status = new_status
    db_order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_order)
    return db_order


# --- DASHBOARD & ANALYTICS CRUD ---
def get_dashboard_analytics(db: Session) -> dict:
    total_flowers = db.query(models.Flower).count()
    total_species = (
        db.query(func.count(func.distinct(models.Flower.species))).scalar() or 0
    )
    total_stock = (
        db.query(func.coalesce(func.sum(models.Flower.stock_quantity), 0)).scalar() or 0
    )

    # Low stock query: threshold > 0 and stock <= threshold
    low_stock_flowers = (
        db.query(models.Flower)
        .options(joinedload(models.Flower.category), joinedload(models.Flower.supplier))
        .filter(
            and_(
                models.Flower.low_stock_threshold > 0,
                models.Flower.stock_quantity <= models.Flower.low_stock_threshold,
            )
        )
        .all()
    )
    low_stock_count = len(low_stock_flowers)

    # Build structured stock alerts
    stock_alerts = []
    for flower in low_stock_flowers:
        alert_level = "CRITICAL" if flower.stock_quantity == 0 else "WARNING"
        stock_alerts.append(
            {
                "flower_id": flower.id,
                "flower_name": flower.name,
                "species": flower.species,
                "current_stock": flower.stock_quantity,
                "low_stock_threshold": flower.low_stock_threshold,
                "alert_level": alert_level,
                "supplier_name": flower.supplier.name if flower.supplier else None,
                "supplier_contact": flower.supplier.email or flower.supplier.phone
                if flower.supplier
                else None,
            }
        )

    total_orders = db.query(models.Order).count()
    total_revenue = (
        db.query(func.coalesce(func.sum(models.Order.total_amount), 0.0))
        .filter(models.Order.status != "Cancelled")
        .scalar()
        or 0.0
    )

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    daily_revenue = (
        db.query(func.coalesce(func.sum(models.Order.total_amount), 0.0))
        .filter(
            and_(
                models.Order.status != "Cancelled",
                models.Order.created_at >= today_start,
            )
        )
        .scalar()
        or 0.0
    )

    # Top selling flowers
    top_selling_query = (
        db.query(
            models.Flower.id,
            models.Flower.name,
            models.Flower.species,
            func.coalesce(func.sum(models.OrderItem.quantity), 0).label("qty_sold"),
            func.coalesce(func.sum(models.OrderItem.subtotal), 0.0).label("revenue"),
        )
        .join(models.OrderItem, models.OrderItem.flower_id == models.Flower.id)
        .join(models.Order, models.Order.id == models.OrderItem.order_id)
        .filter(models.Order.status != "Cancelled")
        .group_by(models.Flower.id, models.Flower.name, models.Flower.species)
        .order_by(desc("qty_sold"))
        .limit(5)
        .all()
    )

    top_selling = [
        {
            "id": item[0],
            "name": item[1],
            "species": item[2],
            "quantity_sold": item[3],
            "total_revenue": float(item[4]),
        }
        for item in top_selling_query
    ]

    # Top selling categories
    top_categories_query = (
        db.query(
            models.Category.id,
            models.Category.name,
            func.coalesce(func.sum(models.OrderItem.quantity), 0).label("qty_sold"),
            func.coalesce(func.sum(models.OrderItem.subtotal), 0.0).label("revenue"),
        )
        .join(models.Flower, models.Flower.category_id == models.Category.id)
        .join(models.OrderItem, models.OrderItem.flower_id == models.Flower.id)
        .join(models.Order, models.Order.id == models.OrderItem.order_id)
        .filter(models.Order.status != "Cancelled")
        .group_by(models.Category.id, models.Category.name)
        .order_by(desc("qty_sold"))
        .limit(5)
        .all()
    )

    top_categories = [
        {
            "id": item[0],
            "name": item[1],
            "quantity_sold": item[2],
            "total_revenue": float(item[3]),
        }
        for item in top_categories_query
    ]

    recent_orders = get_orders(db, skip=0, limit=5)

    return {
        "total_flowers": total_flowers,
        "total_species": total_species,
        "total_stock": total_stock,
        "low_stock_count": low_stock_count,
        "total_orders": total_orders,
        "total_revenue": round(float(total_revenue), 2),
        "daily_revenue": round(float(daily_revenue), 2),
        "top_selling_flowers": top_selling,
        "top_selling_categories": top_categories,
        "low_stock_items": low_stock_flowers,
        "stock_alerts": stock_alerts,
        "recent_orders": recent_orders,
    }
