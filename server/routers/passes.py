"""Digital pass retrieval endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Pass, Booking, User
from server.schemas import PassResponse
from server.dependencies import get_current_user, get_optional_user

router = APIRouter(prefix="/passes", tags=["Passes"])


@router.get("/my-passes", response_model=List[PassResponse])
def get_my_passes(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve all passes owned by the current authenticated user."""
    if current_user:
        passes = (
            db.query(Pass)
            .join(Booking, Pass.booking_id == Booking.id)
            .filter(Booking.user_id == current_user.id)
            .order_by(Pass.created_at.desc())
            .all()
        )
        return passes

    # If unauthenticated, return all passes for demo/testing convenience
    return db.query(Pass).order_by(Pass.created_at.desc()).limit(20).all()


@router.get("/{passId}", response_model=PassResponse)
def get_pass(passId: str, db: Session = Depends(get_db)):
    """Retrieve a specific pass by ID including HMAC SHA-256 signed QR payload."""
    pass_obj = db.query(Pass).filter(Pass.id == passId).first()
    if not pass_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pass with id '{passId}' not found.",
        )
    return pass_obj


@router.get("", response_model=List[PassResponse])
def list_passes(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List passes with pagination."""
    passes = db.query(Pass).offset(skip).limit(limit).all()
    return passes
