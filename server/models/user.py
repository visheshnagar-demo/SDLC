import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    fitness_goals = Column(Text, nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    role = Column(String(20), default="MEMBER", nullable=False)  # MEMBER, ADMIN, STAFF
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    memberships = relationship(
        "UserMembership", back_populates="user", cascade="all, delete-orphan"
    )
    bookings = relationship(
        "ClassBooking", back_populates="user", cascade="all, delete-orphan"
    )
