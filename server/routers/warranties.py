from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, Product, Warranty
from server.schemas import (
    WarrantyCreate,
    WarrantyUpdate,
    WarrantyResponse,
    WarrantyListResponse,
)
from server.auth import get_current_active_user
from server.services.warranty_service import calculate_expiration

router = APIRouter(prefix="/warranties", tags=["Warranties"])


@router.get("", response_model=WarrantyListResponse)
def list_warranties(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status (Active, Expired, Lifetime)"
    ),
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Warranty)
        .join(Product, Warranty.product_id == Product.id)
        .filter(Product.user_id == current_user.id)
    )

    if product_id:
        query = query.filter(Warranty.product_id == product_id)

    if status_filter:
        query = query.filter(Warranty.status.ilike(status_filter))

    total = query.count()
    items = query.order_by(Warranty.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for w in items:
        # Dynamically refresh status in case date passed
        if w.status != "Lifetime" and w.expiration_date:
            exp_date, w_status = calculate_expiration(
                w.start_date, w.coverage_duration_months, w.coverage_type
            )
            if w.status != w_status:
                w.status = w_status
                db.commit()

        resp = WarrantyResponse.model_validate(w)
        resp.product_name = w.product.name if w.product else None
        result.append(resp)

    return WarrantyListResponse(items=result, total=total, skip=skip, limit=limit)


@router.post("", response_model=WarrantyResponse, status_code=status.HTTP_201_CREATED)
def create_warranty(
    warranty_in: WarrantyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Verify product belongs to current user
    product = (
        db.query(Product)
        .filter(
            Product.id == warranty_in.product_id, Product.user_id == current_user.id
        )
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{warranty_in.product_id}' not found.",
        )

    start_date = warranty_in.start_date or product.purchase_date
    exp_date, w_status = calculate_expiration(
        start_date=start_date,
        duration_months=warranty_in.coverage_duration_months,
        coverage_type=warranty_in.coverage_type,
    )

    warranty = Warranty(
        product_id=product.id,
        coverage_duration_months=warranty_in.coverage_duration_months,
        start_date=start_date,
        expiration_date=exp_date,
        coverage_type=warranty_in.coverage_type,
        provider_name=warranty_in.provider_name or product.brand,
        status=w_status,
        notes=warranty_in.notes,
    )
    db.add(warranty)
    db.commit()
    db.refresh(warranty)

    resp = WarrantyResponse.model_validate(warranty)
    resp.product_name = product.name
    return resp


@router.get("/{warranty_id}", response_model=WarrantyResponse)
def get_warranty(
    warranty_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    warranty = (
        db.query(Warranty)
        .join(Product, Warranty.product_id == Product.id)
        .filter(Warranty.id == warranty_id, Product.user_id == current_user.id)
        .first()
    )
    if not warranty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warranty with ID '{warranty_id}' not found.",
        )

    resp = WarrantyResponse.model_validate(warranty)
    resp.product_name = warranty.product.name if warranty.product else None
    return resp


@router.put("/{warranty_id}", response_model=WarrantyResponse)
def update_warranty(
    warranty_id: str,
    warranty_in: WarrantyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    warranty = (
        db.query(Warranty)
        .join(Product, Warranty.product_id == Product.id)
        .filter(Warranty.id == warranty_id, Product.user_id == current_user.id)
        .first()
    )
    if not warranty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warranty with ID '{warranty_id}' not found.",
        )

    update_data = warranty_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(warranty, field, value)

    # Recalculate expiration if duration or start_date or coverage_type changed and expiration wasn't explicitly overridden
    if (
        "coverage_duration_months" in update_data
        or "start_date" in update_data
        or "coverage_type" in update_data
    ) and "expiration_date" not in update_data:
        exp_date, w_status = calculate_expiration(
            start_date=warranty.start_date,
            duration_months=warranty.coverage_duration_months,
            coverage_type=warranty.coverage_type,
        )
        warranty.expiration_date = exp_date
        warranty.status = w_status

    db.commit()
    db.refresh(warranty)

    resp = WarrantyResponse.model_validate(warranty)
    resp.product_name = warranty.product.name if warranty.product else None
    return resp


@router.delete("/{warranty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warranty(
    warranty_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    warranty = (
        db.query(Warranty)
        .join(Product, Warranty.product_id == Product.id)
        .filter(Warranty.id == warranty_id, Product.user_id == current_user.id)
        .first()
    )
    if not warranty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warranty with ID '{warranty_id}' not found.",
        )

    db.delete(warranty)
    db.commit()
    return None
