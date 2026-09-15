from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.auth import create_access_token, get_current_user
from server.database import get_db, verify_password
from server.models import User
from server.schemas import LoginRequest, Token, UserResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password and issue JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive",
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    return Token(access_token=access_token, token_type="bearer", user=user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get profile of authenticated user."""
    return current_user


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """List all registered system users."""
    users = db.query(User).all()
    return users
