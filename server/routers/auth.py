"""Authentication and User Profile router."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from server.auth import create_access_token, get_current_user, verify_password
from server.database import get_db
from server.models import AuditLog, User
from server.schemas import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(request_body: LoginRequest, req: Request, db: Session = Depends(get_db)):
    """Authenticate user with email and password and return JWT token."""
    user = db.query(User).filter(User.email == request_body.email).first()
    client_ip = req.client.host if req.client else "127.0.0.1"

    if not user or not verify_password(request_body.password, user.hashed_password):
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user.id if user else None,
            user_email=request_body.email,
            action="USER_LOGIN_FAILED",
            target_resource="AUTH_SERVICE",
            status="FAILED",
            ip_address=client_ip,
            details="Invalid username or password",
        )
        db.add(audit)
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user.id,
            user_email=user.email,
            action="USER_LOGIN_DENIED",
            target_resource="AUTH_SERVICE",
            status="DENIED",
            ip_address=client_ip,
            details="User account is deactivated",
        )
        db.add(audit)
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "uid": user.id}
    )

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGIN_SUCCESS",
        target_resource="AUTH_SERVICE",
        status="SUCCESS",
        ip_address=client_ip,
        details=f"User logged in successfully with role {user.role}",
    )
    db.add(audit)
    try:
        db.commit()
    except Exception:
        db.rollback()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user
