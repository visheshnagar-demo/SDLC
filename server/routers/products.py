from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, Product, Warranty
from server.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)
from server.auth import get_current_active_user
from server.services.warranty_service import calculate_expiration

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, description="Filter by product category"),
    search: Optional[str] = Query(
        None, description="Search by product name, brand, or serial number"
    ),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.user_id == current_user.id)

    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern))
            | (Product.brand.ilike(search_pattern))
            | (Product.serial_number.ilike(search_pattern))
        )

    total = query.count()
    items = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = Product(
        user_id=current_user.id,
        name=product_in.name,
        brand=product_in.brand,
        category=product_in.category,
        purchase_date=product_in.purchase_date,
        serial_number=product_in.serial_number,
        purchase_price=product_in.purchase_price,
        vendor=product_in.vendor,
        notes=product_in.notes,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # If warranty duration was specified during product registration, auto-create warranty
    if product_in.coverage_duration_months is not None:
        exp_date, w_status = calculate_expiration(
            start_date=product.purchase_date,
            duration_months=product_in.coverage_duration_months,
            coverage_type=product_in.coverage_type or "Standard",
        )
        warranty = Warranty(
            product_id=product.id,
            coverage_duration_months=product_in.coverage_duration_months,
            start_date=product.purchase_date,
            expiration_date=exp_date,
            coverage_type=product_in.coverage_type or "Standard",
            provider_name=product_in.provider_name or product.brand,
            status=w_status,
            notes=f"Created automatically during registration of {product.name}",
        )
        db.add(warranty)
        db.commit()
        db.refresh(product)

    return ProductResponse.model_validate(product)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_in: ProductUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )

    db.delete(product)
    db.commit()
    return None
