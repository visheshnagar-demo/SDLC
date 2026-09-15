import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import PyJWTError
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User

SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY", "dev-secret-change-in-production-office-visitor-pass"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    x_user_email: str | None = Header(None, alias="X-User-Email"),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Try JWT Bearer Token if present
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
            user = (
                db.query(User)
                .filter(User.id == user_id, User.is_active == True)
                .first()
            )
            if user is None:
                raise credentials_exception
            return user
        except PyJWTError:
            raise credentials_exception

    # 2. Check X-User-Id or X-User-Email header for test/mock convenience
    if x_user_id:
        user = (
            db.query(User).filter(User.id == x_user_id, User.is_active == True).first()
        )
        if user:
            return user
    if x_user_email:
        user = (
            db.query(User)
            .filter(User.email == x_user_email, User.is_active == True)
            .first()
        )
        if user:
            return user

    raise credentials_exception


def require_roles(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User role '{current_user.role}' is not in allowed roles ({', '.join(allowed_roles)})",
            )
        return current_user

    return role_checker
