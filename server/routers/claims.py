from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, Product, Warranty, Claim
from server.schemas import (
    ClaimCreate,
    ClaimUpdate,
    ClaimResponse,
    ClaimListResponse,
)
from server.auth import get_current_active_user

router = APIRouter(prefix="/claims", tags=["Repair & Claims"])


@router.get("", response_model=ClaimListResponse)
def list_claims(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by claim status"
    ),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Claim)
        .join(Product, Claim.product_id == Product.id)
        .filter(Product.user_id == current_user.id)
    )

    if product_id:
        query = query.filter(Claim.product_id == product_id)

    if status_filter:
        query = query.filter(Claim.status.ilike(status_filter))

    total = query.count()
    items = query.order_by(Claim.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for c in items:
        resp = ClaimResponse.model_validate(c)
        resp.product_name = c.product.name if c.product else None
        result.append(resp)

    return ClaimListResponse(items=result, total=total, skip=skip, limit=limit)


@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    claim_in: ClaimCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Verify product ownership
    product = (
        db.query(Product)
        .filter(Product.id == claim_in.product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{claim_in.product_id}' not found.",
        )

    # Check warranty status to determine if a warning is needed
    warning_message = None
    warranties = db.query(Warranty).filter(Warranty.product_id == product.id).all()
    if warranties:
        has_active_warranty = any(
            w.status == "Active" or w.status == "Lifetime" for w in warranties
        )
        if not has_active_warranty:
            latest_exp = max(
                (w.expiration_date for w in warranties if w.expiration_date),
                default=None,
            )
            if latest_exp:
                warning_message = f"Warning: Product warranty expired on {latest_exp.isoformat()}. Claim recorded for historical tracking."
            else:
                warning_message = "Warning: Product warranty is no longer active. Claim recorded for historical tracking."
    else:
        warning_message = "Warning: No registered warranty found for this product. Claim recorded for historical tracking."

    claim = Claim(
        product_id=product.id,
        claim_date=claim_in.claim_date,
        issue_description=claim_in.issue_description,
        status=claim_in.status,
        service_center=claim_in.service_center,
        repair_cost=claim_in.repair_cost,
        resolution_notes=claim_in.resolution_notes,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    resp = ClaimResponse.model_validate(claim)
    resp.product_name = product.name
    resp.warning = warning_message
    return resp


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(
    claim_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    claim = (
        db.query(Claim)
        .join(Product, Claim.product_id == Product.id)
        .filter(Claim.id == claim_id, Product.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with ID '{claim_id}' not found.",
        )

    resp = ClaimResponse.model_validate(claim)
    resp.product_name = claim.product.name if claim.product else None
    return resp


@router.patch("/{claim_id}", response_model=ClaimResponse)
@router.put("/{claim_id}", response_model=ClaimResponse)
def update_claim(
    claim_id: str,
    claim_in: ClaimUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    claim = (
        db.query(Claim)
        .join(Product, Claim.product_id == Product.id)
        .filter(Claim.id == claim_id, Product.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with ID '{claim_id}' not found.",
        )

    update_data = claim_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(claim, field, value)

    db.commit()
    db.refresh(claim)

    resp = ClaimResponse.model_validate(claim)
    resp.product_name = claim.product.name if claim.product else None
    return resp


@router.delete("/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_claim(
    claim_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    claim = (
        db.query(Claim)
        .join(Product, Claim.product_id == Product.id)
        .filter(Claim.id == claim_id, Product.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with ID '{claim_id}' not found.",
        )

    db.delete(claim)
    db.commit()
    return None
