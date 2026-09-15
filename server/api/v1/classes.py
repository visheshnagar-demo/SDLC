from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.core.deps import get_db
from server.models.fitness_class import FitnessClass
from server.schemas.fitness_class import FitnessClassRead

router = APIRouter()


@router.get("", response_model=List[FitnessClassRead])
def get_classes(
    date: Optional[str] = Query(
        None, description="Filter classes by date (YYYY-MM-DD)"
    ),
    category: Optional[str] = Query(
        None, description="Filter by category (e.g. HIIT, Yoga, Strength)"
    ),
    instructor: Optional[str] = Query(None, description="Filter by instructor name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(FitnessClass)

    if category:
        query = query.filter(FitnessClass.category.ilike(f"%{category}%"))

    if instructor:
        query = query.filter(FitnessClass.instructor_name.ilike(f"%{instructor}%"))

    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            start_of_day = datetime(
                target_date.year,
                target_date.month,
                target_date.day,
                0,
                0,
                0,
                tzinfo=timezone.utc,
            )
            end_of_day = datetime(
                target_date.year,
                target_date.month,
                target_date.day,
                23,
                59,
                59,
                tzinfo=timezone.utc,
            )
            query = query.filter(
                FitnessClass.start_time >= start_of_day,
                FitnessClass.start_time <= end_of_day,
            )
        except ValueError:
            pass

    classes = (
        query.order_by(FitnessClass.start_time.asc()).offset(skip).limit(limit).all()
    )
    return classes


@router.get("/{class_id}", response_model=FitnessClassRead)
def get_class(class_id: str, db: Session = Depends(get_db)):
    fitness_class = db.query(FitnessClass).filter(FitnessClass.id == class_id).first()
    if not fitness_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )
    return fitness_class
