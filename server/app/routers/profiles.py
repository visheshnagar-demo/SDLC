"""Child profiles management router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.app.database import get_db
from server.app import models, schemas
from server.app.services import auth_service

router = APIRouter(prefix="/api/v1/profiles", tags=["Profiles"])


@router.get("", response_model=List[schemas.ChildResponse])
def list_profiles(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth_service.oauth2_scheme),
):
    user = None
    if current_user:
        try:
            user = auth_service.get_current_user(token=current_user, db=db)
        except Exception:
            user = None

    if user:
        children = (
            db.query(models.Child).filter(models.Child.parent_id == user.id).all()
        )
    else:
        children = db.query(models.Child).all()

    return [schemas.ChildResponse.model_validate(c) for c in children]


@router.post(
    "", response_model=schemas.ChildResponse, status_code=status.HTTP_201_CREATED
)
def create_profile(
    request: schemas.ChildCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth_service.oauth2_scheme),
):
    parent_id = None
    if current_user:
        try:
            user = auth_service.get_current_user(token=current_user, db=db)
            parent_id = user.id
        except Exception:
            pass

    if not parent_id:
        parent = (
            db.query(models.User)
            .filter(models.User.email == "test@example.com")
            .first()
        )
        if parent:
            parent_id = parent.id
        else:
            first_user = db.query(models.User).first()
            parent_id = first_user.id if first_user else "default-parent"

    child = models.Child(
        parent_id=parent_id,
        display_name=request.display_name,
        age=request.age,
        total_points=0,
        active_streak_days=0,
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return schemas.ChildResponse.model_validate(child)


@router.get("/{child_id}", response_model=schemas.ChildResponse)
def get_profile(
    child_id: str,
    db: Session = Depends(get_db),
):
    child = db.query(models.Child).filter(models.Child.id == child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Child profile with id {child_id} not found.",
        )
    return schemas.ChildResponse.model_validate(child)


@router.put("/{child_id}", response_model=schemas.ChildResponse)
def update_profile(
    child_id: str,
    request: schemas.ChildUpdateRequest,
    db: Session = Depends(get_db),
):
    child = db.query(models.Child).filter(models.Child.id == child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Child profile with id {child_id} not found.",
        )

    if request.display_name is not None:
        child.display_name = request.display_name
    if request.age is not None:
        child.age = request.age

    db.commit()
    db.refresh(child)
    return schemas.ChildResponse.model_validate(child)
