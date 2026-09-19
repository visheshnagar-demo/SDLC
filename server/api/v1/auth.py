from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import Token, UserResponse
from server.auth import (
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginPayload(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


@router.post("/login", response_model=Token)
def login(
    payload: LoginPayload,
    db: Session = Depends(get_db),
):
    email = payload.email or payload.username
    password = payload.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email (or username) and password are required",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    user_resp = UserResponse.model_validate(user)
    return Token(access_token=access_token, token_type="bearer", user=user_resp)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
