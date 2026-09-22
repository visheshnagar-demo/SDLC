from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.auth import (
    create_access_token,
    get_current_active_user,
    hash_password,
    verify_password,
)
from server.database import get_db
from server.models import User, UserAddress
from server.schemas import (
    Token,
    UserAddressCreate,
    UserAddressResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    # Force role to customer unless specific role passed and validated
    role = user_in.role if user_in.role in ["customer", "admin"] else "customer"
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=role,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )
    return user


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT access token",
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated.",
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post(
    "/token",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="OAuth2 Password Bearer login for OpenAPI Docs",
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post(
    "/addresses",
    response_model=UserAddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a saved shipping address",
)
def create_address(
    address_in: UserAddressCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if address_in.is_default:
        # Reset any existing default address
        db.query(UserAddress).filter(UserAddress.user_id == current_user.id).update(
            {"is_default": False}
        )

    address = UserAddress(
        user_id=current_user.id,
        street_address=address_in.street_address,
        city=address_in.city,
        state=address_in.state,
        postal_code=address_in.postal_code,
        country=address_in.country,
        is_default=address_in.is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.get(
    "/addresses",
    response_model=List[UserAddressResponse],
    status_code=status.HTTP_200_OK,
    summary="List saved shipping addresses for current user",
)
def list_addresses(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    return db.query(UserAddress).filter(UserAddress.user_id == current_user.id).all()
