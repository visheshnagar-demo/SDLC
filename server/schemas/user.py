from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    fitness_goals: Optional[str] = None
    emergency_contact: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    fitness_goals: Optional[str] = None
    emergency_contact: Optional[str] = None
    role: Optional[str] = "MEMBER"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    fitness_goals: Optional[str] = None
    emergency_contact: Optional[str] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    is_active: bool
    created_at: datetime
