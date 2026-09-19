from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import UserOut
from server.auth import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("", response_model=List[UserOut])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    department: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(User)
    if department:
        query = query.filter(User.department == department)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()
