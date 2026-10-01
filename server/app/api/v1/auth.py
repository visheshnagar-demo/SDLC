import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from server.app.api.deps import get_client_ip, get_current_user
from server.app.core.database import get_db
from server.app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from server.app.models.user import User
from server.app.schemas.auth import Token, UserLogin, UserRegister, UserResponse
from server.app.services.audit_service import log_audit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(
    user_in: UserRegister,
    request: Request,
    db: Session = Depends(get_db),
):
    # Check if email or username already exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists.",
        )

    user = User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=(user_in.role or "PATIENT").upper(),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(
        db=db,
        action="USER_REGISTER",
        entity_type="User",
        entity_id=user.id,
        user_id=user.id,
        details={"username": user.username, "role": user.role},
        ip_address=get_client_ip(request),
    )

    return user


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    identifier = login_data.username_or_email or login_data.email or login_data.username
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required.",
        )

    user = (
        db.query(User)
        .filter((User.email == identifier) | (User.username == identifier))
        .first()
    )

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    token = create_access_token(subject=user.id, role=user.role, email=user.email)

    log_audit(
        db=db,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=user.id,
        user_id=user.id,
        ip_address=get_client_ip(request),
    )

    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
