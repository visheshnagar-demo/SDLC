from typing import Optional
from pydantic import BaseModel, EmailStr
from server.schemas.user import UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenData(BaseModel):
    sub: Optional[str] = None
