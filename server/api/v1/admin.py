import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.core.deps import get_current_admin, get_db
from server.models.booking import ClassBooking
from server.models.fitness_class import FitnessClass
from server.models.membership import UserMembership
from server.models.user import User
from server.schemas.booking import AttendeeRosterItem, ClassRosterResponse
from server.schemas.fitness_class import (
    FitnessClassCreate,
    FitnessClassRead,
    FitnessClassUpdate,
)

router = APIRouter()


@router.post(
    "/classes", response_model=FitnessClassRead, status_code=status.HTTP_201_CREATED
)
def create_class(
    class_in: FitnessClassCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fitness_class = FitnessClass(
        id=str(uuid.uuid4()),
        title=class_in.title,
        category=class_in.category,
        description=class_in.description,
        instructor_name=class_in.instructor_name,
        start_time=class_in.start_time,
        end_time=class_in.end_time,
        max_capacity=class_in.max_capacity,
        booked_count=0,
    )
    db.add(fitness_class)
    db.commit()
    db.refresh(fitness_class)
    return fitness_class


@router.put("/classes/{class_id}", response_model=FitnessClassRead)
def update_class(
    class_id: str,
    class_update: FitnessClassUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fitness_class = db.query(FitnessClass).filter(FitnessClass.id == class_id).first()
    if not fitness_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    if class_update.title is not None:
        fitness_class.title = class_update.title
    if class_update.category is not None:
        fitness_class.category = class_update.category
    if class_update.description is not None:
        fitness_class.description = class_update.description
    if class_update.instructor_name is not None:
        fitness_class.instructor_name = class_update.instructor_name
    if class_update.start_time is not None:
        fitness_class.start_time = class_update.start_time
    if class_update.end_time is not None:
        fitness_class.end_time = class_update.end_time
    if class_update.max_capacity is not None:
        if class_update.max_capacity < fitness_class.booked_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reduce capacity below current booked count ({fitness_class.booked_count})",
            )
        fitness_class.max_capacity = class_update.max_capacity

    db.add(fitness_class)
    db.commit()
    db.refresh(fitness_class)
    return fitness_class


@router.delete("/classes/{class_id}")
def delete_class(
    class_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fitness_class = db.query(FitnessClass).filter(FitnessClass.id == class_id).first()
    if not fitness_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    # Cancel all bookings for this class
    bookings = db.query(ClassBooking).filter(ClassBooking.class_id == class_id).all()
    for b in bookings:
        b.status = "CANCELLED"
        db.add(b)

    db.delete(fitness_class)
    db.commit()
    return {"detail": "Class deleted successfully"}


@router.get("/classes/{class_id}/roster", response_model=ClassRosterResponse)
def get_class_roster(
    class_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fitness_class = db.query(FitnessClass).filter(FitnessClass.id == class_id).first()
    if not fitness_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    bookings = (
        db.query(ClassBooking)
        .filter(ClassBooking.class_id == class_id, ClassBooking.status == "CONFIRMED")
        .all()
    )

    attendees = []
    for b in bookings:
        user = b.user
        active_mem = (
            db.query(UserMembership)
            .filter(
                UserMembership.user_id == user.id, UserMembership.status == "ACTIVE"
            )
            .first()
        )
        membership_status = (
            active_mem.plan.name if active_mem and active_mem.plan else "Active Member"
        )

        attendees.append(
            AttendeeRosterItem(
                booking_id=b.id,
                user_id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone_number=user.phone_number,
                membership_status=membership_status,
                booked_at=b.booked_at,
                status=b.status,
            )
        )

    return ClassRosterResponse(
        class_id=fitness_class.id,
        class_title=fitness_class.title,
        total_booked=len(attendees),
        max_capacity=fitness_class.max_capacity,
        attendees=attendees,
    )


@router.get("/stats", response_model=Dict[str, Any])
def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_classes = db.query(FitnessClass).count()
    active_bookings = (
        db.query(ClassBooking).filter(ClassBooking.status == "CONFIRMED").count()
    )
    classes = db.query(FitnessClass).all()
    total_capacity = sum(c.max_capacity for c in classes) if classes else 0
    total_booked = sum(c.booked_count for c in classes) if classes else 0
    utilization_rate = (
        round((total_booked / total_capacity * 100), 1) if total_capacity > 0 else 0.0
    )
    instructors = db.query(FitnessClass.instructor_name).distinct().count()

    return {
        "total_classes": total_classes,
        "active_bookings": active_bookings,
        "total_capacity": total_capacity,
        "capacity_utilization_percent": utilization_rate,
        "active_instructors": instructors,
    }
