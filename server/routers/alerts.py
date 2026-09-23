from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, Product, Warranty, Claim
from server.schemas import (
    AlertListResponse,
    ExpirationAlert,
    DashboardStatsResponse,
)
from server.auth import get_current_active_user
from server.services.warranty_service import is_expiring_soon, calculate_expiration

router = APIRouter(prefix="/alerts", tags=["Alerts & Analytics"])


@router.get("", response_model=AlertListResponse)
def get_expiration_alerts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Returns warranties expiring within a 30-day window.
    Lifetime warranties and already expired warranties are excluded from active alerts.
    """
    warranties = (
        db.query(Warranty)
        .join(Product, Warranty.product_id == Product.id)
        .filter(Product.user_id == current_user.id)
        .all()
    )

    alert_items = []
    for w in warranties:
        # Dynamic check
        if w.status != "Lifetime" and w.expiration_date:
            exp_date, w_status = calculate_expiration(
                w.start_date, w.coverage_duration_months, w.coverage_type
            )
            if w.status != w_status:
                w.status = w_status
                db.commit()

        expiring, days_remaining = is_expiring_soon(
            w.expiration_date, w.status, window_days=30
        )
        if expiring:
            alert_items.append(
                ExpirationAlert(
                    warranty_id=w.id,
                    product_id=w.product_id,
                    product_name=w.product.name,
                    brand=w.product.brand,
                    category=w.product.category,
                    expiration_date=w.expiration_date,
                    days_remaining=days_remaining,
                    coverage_type=w.coverage_type,
                    status=w.status,
                )
            )

    # Sort alerts by closest expiration date
    alert_items.sort(key=lambda x: x.days_remaining)
    return AlertListResponse(items=alert_items, total=len(alert_items))


@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Returns overview KPI metrics for the user's dashboard.
    """
    total_products = (
        db.query(Product).filter(Product.user_id == current_user.id).count()
    )

    warranties = (
        db.query(Warranty)
        .join(Product, Warranty.product_id == Product.id)
        .filter(Product.user_id == current_user.id)
        .all()
    )

    active_count = 0
    expired_count = 0
    expiring_soon_count = 0

    for w in warranties:
        if w.status != "Lifetime" and w.expiration_date:
            exp_date, w_status = calculate_expiration(
                w.start_date, w.coverage_duration_months, w.coverage_type
            )
            if w.status != w_status:
                w.status = w_status
                db.commit()

        if w.status == "Active" or w.status == "Lifetime":
            active_count += 1
        elif w.status == "Expired":
            expired_count += 1

        expiring, _ = is_expiring_soon(w.expiration_date, w.status, window_days=30)
        if expiring:
            expiring_soon_count += 1

    claims = (
        db.query(Claim)
        .join(Product, Claim.product_id == Product.id)
        .filter(Product.user_id == current_user.id)
        .all()
    )

    total_claims = len(claims)
    total_claim_costs = sum(c.repair_cost or 0.0 for c in claims)

    return DashboardStatsResponse(
        total_products=total_products,
        active_warranties=active_count,
        expiring_soon_count=expiring_soon_count,
        expired_warranties=expired_count,
        total_claim_costs=round(total_claim_costs, 2),
        total_claims=total_claims,
    )
