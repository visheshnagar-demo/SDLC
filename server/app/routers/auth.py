"""Auth router for registration and login."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.app.database import get_db
from server.app import models, schemas
from server.app.services import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=schemas.TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: schemas.UserRegisterRequest,
    db: Session = Depends(get_db),
):
    user = auth_service.register_user(db, request)
    token = auth_service.create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    request: schemas.UserLoginRequest,
    db: Session = Depends(get_db),
):
    user = auth_service.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_service.create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_me(
    current_user: models.User = Depends(auth_service.get_current_user),
):
    return schemas.UserResponse.model_validate(current_user)
