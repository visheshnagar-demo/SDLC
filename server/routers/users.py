import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import UserRead, UserCreate
from server.auth import (
    get_current_support_or_admin,
    get_current_admin_user,
    get_password_hash,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserRead])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin),
):
    query = db.query(User)
    if department:
        query = query.filter(User.department.ilike(f"%{department}%"))
    return query.order_by(User.full_name.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=UserRead, status_code=201)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{user_in.email}' already exists.",
        )

    existing_emp_id = (
        db.query(User).filter(User.employee_id == user_in.employee_id).first()
    )
    if existing_emp_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with Employee ID '{user_in.employee_id}' already exists.",
        )

    user = User(
        id=str(uuid.uuid4()),
        employee_id=user_in.employee_id,
        email=user_in.email,
        full_name=user_in.full_name,
        department=user_in.department,
        role=user_in.role,
        is_active=user_in.is_active,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
