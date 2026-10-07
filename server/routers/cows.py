from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Cow, HealthRecord, MilkYieldLog, User
from server.schemas import (
    CowCreate,
    CowUpdate,
    CowResponse,
    CowDetailResponse,
    HealthRecordResponse,
    MilkYieldLogResponse,
)
from server.auth import get_current_user, require_farm_manager

router = APIRouter(prefix="/cows", tags=["Cattle Inventory"])


@router.get(
    "",
    response_model=List[CowResponse],
    status_code=status.HTTP_200_OK,
    summary="List cattle profiles with pagination and search filters",
)
def list_cows(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(
        None, description="Search by Tag ID, Breed, or Location"
    ),
    health_status: Optional[str] = Query(None, description="Filter by health status"),
    location: Optional[str] = Query(None, description="Filter by location"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Cow)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Cow.tag_id.ilike(search_fmt),
                Cow.breed.ilike(search_fmt),
                Cow.location.ilike(search_fmt),
            )
        )

    if health_status:
        query = query.filter(Cow.health_status == health_status)

    if location:
        query = query.filter(Cow.location == location)

    cows = query.order_by(Cow.created_at.desc()).offset(skip).limit(limit).all()
    return cows


@router.post(
    "",
    response_model=CowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new cattle profile (Farm Manager only)",
)
def create_cow(
    cow_in: CowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_farm_manager),
):
    # Validation 1: Future Date of Birth
    if cow_in.date_of_birth > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date of birth cannot be in the future",
        )

    # Validation 2: Unique Tag ID
    existing = db.query(Cow).filter(Cow.tag_id == cow_in.tag_id.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cow with Tag ID '{cow_in.tag_id}' already exists",
        )

    # Validation 3: Weight
    if cow_in.weight_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Weight must be greater than zero",
        )

    new_cow = Cow(
        tag_id=cow_in.tag_id.strip(),
        breed=cow_in.breed.strip(),
        date_of_birth=cow_in.date_of_birth,
        gender=cow_in.gender,
        health_status=cow_in.health_status,
        weight_kg=cow_in.weight_kg,
        location=cow_in.location.strip(),
    )
    db.add(new_cow)
    db.commit()
    db.refresh(new_cow)
    return new_cow


@router.get(
    "/{id}",
    response_model=CowDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed cattle profile by ID",
)
def get_cow(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cow = db.query(Cow).filter(Cow.id == id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cow not found",
        )

    recent_health = (
        db.query(HealthRecord)
        .filter(HealthRecord.cow_id == id)
        .order_by(desc(HealthRecord.event_date))
        .limit(10)
        .all()
    )

    recent_milk = (
        db.query(MilkYieldLog)
        .filter(MilkYieldLog.cow_id == id)
        .order_by(desc(MilkYieldLog.logging_date))
        .limit(7)
        .all()
    )

    avg_yield = 0.0
    if recent_milk:
        avg_yield = round(
            sum(log.total_yield_liters for log in recent_milk) / len(recent_milk), 2
        )

    return CowDetailResponse(
        id=cow.id,
        tag_id=cow.tag_id,
        breed=cow.breed,
        date_of_birth=cow.date_of_birth,
        gender=cow.gender,
        health_status=cow.health_status,
        weight_kg=cow.weight_kg,
        location=cow.location,
        created_at=cow.created_at,
        updated_at=cow.updated_at,
        recent_health_records=[
            HealthRecordResponse.model_validate(hr) for hr in recent_health
        ],
        recent_milk_logs=[
            MilkYieldLogResponse.model_validate(ml) for ml in recent_milk
        ],
        seven_day_avg_yield=avg_yield,
    )


@router.put(
    "/{id}",
    response_model=CowResponse,
    status_code=status.HTTP_200_OK,
    summary="Update cattle profile (Farm Manager only)",
)
def update_cow(
    id: str,
    cow_in: CowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_farm_manager),
):
    cow = db.query(Cow).filter(Cow.id == id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cow not found",
        )

    if cow_in.tag_id is not None:
        tag = cow_in.tag_id.strip()
        if tag != cow.tag_id:
            existing = db.query(Cow).filter(Cow.tag_id == tag).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cow with Tag ID '{tag}' already exists",
                )
            cow.tag_id = tag

    if cow_in.date_of_birth is not None:
        if cow_in.date_of_birth > date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date of birth cannot be in the future",
            )
        cow.date_of_birth = cow_in.date_of_birth

    if cow_in.breed is not None:
        cow.breed = cow_in.breed.strip()
    if cow_in.gender is not None:
        cow.gender = cow_in.gender
    if cow_in.health_status is not None:
        cow.health_status = cow_in.health_status
    if cow_in.weight_kg is not None:
        if cow_in.weight_kg <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Weight must be greater than zero",
            )
        cow.weight_kg = cow_in.weight_kg
    if cow_in.location is not None:
        cow.location = cow_in.location.strip()

    db.commit()
    db.refresh(cow)
    return cow


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete cattle profile (Farm Manager only)",
)
def delete_cow(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_farm_manager),
):
    cow = db.query(Cow).filter(Cow.id == id).first()
    if not cow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cow not found",
        )

    db.delete(cow)
    db.commit()
    return None
