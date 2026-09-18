from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from server.database import get_db
from server.models import Order, OrderItem, Flower
from server.schemas import DashboardAnalytics, TopSellingFlower

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardAnalytics)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    # Total revenue from non-cancelled orders
    total_revenue_result = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.status != "Cancelled")
        .scalar()
    )
    total_revenue = float(total_revenue_result) if total_revenue_result else 0.0

    # Total orders count
    total_orders = (
        db.query(func.count(Order.id)).filter(Order.status != "Cancelled").scalar() or 0
    )

    # Total flowers in stock
    total_stock_result = db.query(func.sum(Flower.stock_quantity)).scalar()
    total_flowers_in_stock = int(total_stock_result) if total_stock_result else 0

    # Low stock count (stock_quantity <= low_stock_threshold AND low_stock_threshold > 0)
    low_stock_count = (
        db.query(func.count(Flower.id))
        .filter(
            Flower.low_stock_threshold > 0,
            Flower.stock_quantity <= Flower.low_stock_threshold,
        )
        .scalar()
        or 0
    )

    # Top selling flowers
    top_selling_query = (
        db.query(
            OrderItem.flower_id,
            Flower.name,
            Flower.species,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.line_total).label("revenue_generated"),
        )
        .join(Flower, OrderItem.flower_id == Flower.id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.status != "Cancelled")
        .group_by(OrderItem.flower_id, Flower.name, Flower.species)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    top_selling = [
        TopSellingFlower(
            flower_id=row.flower_id,
            name=row.name,
            species=row.species,
            total_sold=int(row.total_sold or 0),
            revenue_generated=float(row.revenue_generated or 0.0),
        )
        for row in top_selling_query
    ]

    return DashboardAnalytics(
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        total_flowers_in_stock=total_flowers_in_stock,
        low_stock_count=low_stock_count,
        top_selling_flowers=top_selling,
    )
