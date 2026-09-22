from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from server.auth import require_admin
from server.database import get_db
from server.models import Watch, User
from server.schemas import (
    WatchCreateRequest,
    WatchDetailResponse,
    WatchListResponse,
    WatchResponse,
    WatchUpdateRequest,
)

router = APIRouter(prefix="/watches", tags=["Watch Catalog & Atelier Details"])


def _cleanup_expired_reservations(db: Session):
    """Lazily release expired 15-minute reservation holds to keep inventory accurate."""
    now_utc = datetime.now(timezone.utc)
    expired_watches = (
        db.query(Watch)
        .filter(
            Watch.status == "RESERVED",
            Watch.hold_expires_at.isnot(None),
            Watch.hold_expires_at < now_utc,
        )
        .all()
    )
    for w in expired_watches:
        w.status = "AVAILABLE"
        w.reserved_by_user_id = None
        w.hold_expires_at = None
    if expired_watches:
        db.commit()


@router.get(
    "",
    response_model=WatchListResponse,
    status_code=status.HTTP_200_OK,
    summary="Query luxury timepiece catalog with multi-attribute filtering",
)
def get_watches(
    brand: Optional[str] = Query(
        None, description="Filter by brand (e.g. Rolex, Omega)"
    ),
    model: Optional[str] = Query(None, description="Filter by model name"),
    search: Optional[str] = Query(
        None, description="Free text search across brand, model, reference"
    ),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price in USD"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price in USD"),
    min_condition: Optional[float] = Query(
        None, ge=1.0, le=10.0, description="Minimum condition score"
    ),
    condition_grade: Optional[str] = Query(
        None, description="Filter by condition grade (e.g. Mint)"
    ),
    movement_type: Optional[str] = Query(
        None, description="Filter by movement type (Automatic, Manual, Quartz)"
    ),
    box_included: Optional[bool] = Query(None, description="Box included flag"),
    papers_included: Optional[bool] = Query(None, description="Papers included flag"),
    box_papers: Optional[str] = Query(None, description="complete_set, watch_only"),
    year_min: Optional[int] = Query(None, description="Minimum manufacturing year"),
    year_max: Optional[int] = Query(None, description="Maximum manufacturing year"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="AVAILABLE, RESERVED, SOLD"
    ),
    sort_by: Optional[str] = Query(
        None, description="price_asc, price_desc, condition_desc, newest, year_desc"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max number of records to return"),
    db: Session = Depends(get_db),
):
    _cleanup_expired_reservations(db)

    query = db.query(Watch)

    if status_filter:
        query = query.filter(Watch.status == status_filter.upper())

    if brand:
        query = query.filter(Watch.brand.ilike(f"%{brand}%"))

    if model:
        query = query.filter(Watch.model.ilike(f"%{model}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Watch.brand.ilike(search_pattern),
                Watch.model.ilike(search_pattern),
                Watch.reference_number.ilike(search_pattern),
                Watch.serial_number.ilike(search_pattern),
                Watch.dial_color.ilike(search_pattern),
            )
        )

    if min_price is not None:
        query = query.filter(Watch.price >= min_price)
    if max_price is not None:
        query = query.filter(Watch.price <= max_price)

    if min_condition is not None:
        query = query.filter(Watch.condition_score >= min_condition)

    if condition_grade:
        query = query.filter(Watch.condition_grade.ilike(f"%{condition_grade}%"))

    if movement_type:
        query = query.filter(Watch.movement_type.ilike(f"%{movement_type}%"))

    if box_included is not None:
        query = query.filter(Watch.box_included == box_included)

    if papers_included is not None:
        query = query.filter(Watch.papers_included == papers_included)

    if box_papers:
        if box_papers.lower() in ["complete_set", "complete set"]:
            query = query.filter(
                Watch.box_included.is_(True), Watch.papers_included.is_(True)
            )
        elif box_papers.lower() in ["watch_only", "watch only"]:
            query = query.filter(
                Watch.box_included.is_(False), Watch.papers_included.is_(False)
            )

    if year_min is not None:
        query = query.filter(Watch.year_of_manufacture >= year_min)
    if year_max is not None:
        query = query.filter(Watch.year_of_manufacture <= year_max)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(asc(Watch.price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Watch.price))
    elif sort_by == "condition_desc":
        query = query.order_by(desc(Watch.condition_score))
    elif sort_by == "year_desc":
        query = query.order_by(desc(Watch.year_of_manufacture))
    elif sort_by == "newest":
        query = query.order_by(desc(Watch.created_at))
    else:
        query = query.order_by(desc(Watch.created_at))

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get(
    "/{watch_id}",
    response_model=WatchDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get comprehensive timepiece details & authenticity certificate status",
)
def get_watch_by_id(watch_id: str, db: Session = Depends(get_db)):
    _cleanup_expired_reservations(db)
    watch = db.query(Watch).filter(Watch.id == watch_id).first()
    if not watch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timepiece with ID '{watch_id}' not found.",
        )
    return watch


@router.post(
    "",
    response_model=WatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new luxury watch listing (Admin only)",
)
def create_watch(
    watch_in: WatchCreateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Watch).filter(Watch.serial_number == watch_in.serial_number).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Watch with serial number '{watch_in.serial_number}' already exists in vault inventory.",
        )

    watch_data = watch_in.model_dump()
    img_urls = watch_data.pop("image_urls", [])
    watch = Watch(**watch_data)
    watch.image_urls = img_urls

    db.add(watch)
    db.commit()
    db.refresh(watch)
    return watch


@router.patch(
    "/{watch_id}",
    response_model=WatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Update watch listing details or verification status (Admin only)",
)
def update_watch(
    watch_id: str,
    watch_update: WatchUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    watch = db.query(Watch).filter(Watch.id == watch_id).first()
    if not watch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timepiece with ID '{watch_id}' not found.",
        )

    update_data = watch_update.model_dump(exclude_unset=True)
    if "image_urls" in update_data:
        watch.image_urls = update_data.pop("image_urls")

    for key, value in update_data.items():
        setattr(watch, key, value)

    db.commit()
    db.refresh(watch)
    return watch


@router.delete(
    "/{watch_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a watch listing from vault (Admin only)",
)
def delete_watch(
    watch_id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    watch = db.query(Watch).filter(Watch.id == watch_id).first()
    if not watch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timepiece with ID '{watch_id}' not found.",
        )
    if watch.status == "SOLD":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a timepiece that has already been purchased and sold.",
        )

    db.delete(watch)
    db.commit()
    return {
        "detail": f"Timepiece '{watch.brand} {watch.model}' removed from inventory."
    }
