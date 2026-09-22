"""Authentication and User Profile Router."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User, AuditLog
from server.schemas import UserLogin, UserCreate, UserOut, TokenResponse
from server.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    login_data: Optional[UserLogin] = None,
    form_data: Optional[OAuth2PasswordRequestForm] = Depends(lambda: None),
    db: Session = Depends(get_db),
):
    """Authenticate user with email/username and password."""
    email = None
    password = None

    if form_data and form_data.username:
        email = form_data.username
        password = form_data.password
    elif login_data:
        email = login_data.username or login_data.email
        password = login_data.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email/username and password are required",
        )

    user = db.query(User).filter(User.email == email).first()
    client_ip = request.client.host if request.client else "127.0.0.1"

    if not user or not verify_password(password, user.hashed_password):
        # Audit log failed login
        audit = AuditLog(
            user_id=user.id if user else None,
            user_email=email,
            action="USER_LOGIN",
            target_resource="AUTH",
            status="FAILED",
            details="Invalid credentials provided",
            ip_address=client_ip,
        )
        db.add(audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )

    # Audit log successful login
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGIN",
        target_resource="AUTH",
        status="SUCCESS",
        details="User logged in successfully",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile information for the authenticated user."""
    return current_user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(
    request: Request,
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """Register a new user account."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role if user_in.role in ["ADMIN", "READ_ONLY"] else "READ_ONLY",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="USER_REGISTER",
        target_resource=f"USER:{user.id}",
        status="SUCCESS",
        details=f"User registered with role {user.role}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    return user
