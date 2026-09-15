from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.core.deps import get_current_user, get_db
from server.models.user import User
from server.schemas.user import UserRead, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_user_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserRead)
def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
    if user_update.fitness_goals is not None:
        current_user.fitness_goals = user_update.fitness_goals
    if user_update.emergency_contact is not None:
        current_user.emergency_contact = user_update.emergency_contact

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
