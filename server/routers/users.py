from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import UserResponse
from server.auth import get_current_support_or_admin_user

router = APIRouter(prefix="/api/v1/users", tags=["Users & Employees"])


@router.get("", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin_user),
):
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if department:
        query = query.filter(User.department.ilike(f"%{department}%"))

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_fmt))
            | (User.email.ilike(search_fmt))
            | (User.employee_id.ilike(search_fmt))
        )

    return query.offset(skip).limit(limit).all()
