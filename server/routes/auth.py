from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.config import settings
from server.database import get_db, verify_password
from server.models.audit import User
from server.schemas.auth import LoginRequest, Token, UserResponse
from server.middleware.auth import create_access_token, get_current_user
from server.middleware.audit import log_audit_event

router = APIRouter(tags=["Authentication"])


@router.post("/auth/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=access_token_expires,
    )

    log_audit_event(
        db=db,
        action="USER_LOGIN",
        resource="/api/v1/auth/login",
        user_id=user.id,
        user_role=user.role,
        details=f"Successful login for user {user.email}",
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        email=user.email,
    )


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
