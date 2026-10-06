import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from server.database import get_db
from server import models, schemas
from server.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED
)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(models.User).filter(models.User.email == user_in.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    user = models.User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "Patient",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If role is Patient, create patient profile if one doesn't exist
    if user.role == "Patient":
        names = user.full_name.split(" ", 1)
        first_name = names[0]
        last_name = names[1] if len(names) > 1 else "Unknown"
        mrn = f"MRN-{uuid.uuid4().hex[:6].upper()}"
        patient = models.Patient(
            id=str(uuid.uuid4()),
            user_id=user.id,
            mrn=mrn,
            first_name=first_name,
            last_name=last_name,
            date_of_birth="2000-01-01",
            gender="Other",
            phone="Not Provided",
            email=user.email,
            insurance_status="Active",
        )
        db.add(patient)
        db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name},
        expires_delta=access_token_expires,
    )

    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.from_orm(user)
        if hasattr(schemas.UserResponse, "from_orm")
        else schemas.UserResponse.model_validate(user),
    )


@router.post("/login", response_model=schemas.Token)
async def login(request: Request, db: Session = Depends(get_db)):
    # Support both JSON payload and Form Data
    email = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        email = body.get("email") or body.get("username")
        password = body.get("password")
    else:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email/username and password are required",
        )

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
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

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name},
        expires_delta=access_token_expires,
    )

    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.from_orm(user)
        if hasattr(schemas.UserResponse, "from_orm")
        else schemas.UserResponse.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
