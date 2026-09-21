import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="GUARD", nullable=False)  # ADMIN, GUARD, MEDICAL
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )


class Cell(Base):
    __tablename__ = "cells"

    id = Column(String, primary_key=True, default=generate_uuid)
    cell_number = Column(String, unique=True, index=True, nullable=False)  # e.g., "A-101"
    block_name = Column(String, nullable=False)  # e.g., "Block A"
    capacity = Column(Integer, nullable=False, default=2)
    current_occupancy = Column(Integer, nullable=False, default=0)
    security_tier = Column(String, nullable=False, default="MEDIUM")  # MINIMUM, MEDIUM, MAXIMUM, HIGH_SECURITY
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    inmates = relationship("Inmate", back_populates="cell")


class Inmate(Base):
    __tablename__ = "inmates"

    id = Column(String, primary_key=True, default=generate_uuid)
    inmate_number = Column(String, unique=True, index=True, nullable=False)  # e.g., "INM-1002"
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=False)  # YYYY-MM-DD
    security_tier = Column(String, nullable=False, default="MEDIUM")  # MINIMUM, MEDIUM, MAXIMUM, HIGH_SECURITY
    cell_id = Column(String, ForeignKey("cells.id"), nullable=True)
    medical_alerts = Column(Text, default="[]", nullable=False)  # JSON array string
    offense_history = Column(Text, default="[]", nullable=False)  # JSON array string
    emergency_contacts = Column(Text, default="[]", nullable=False)  # JSON array string
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    cell = relationship("Cell", back_populates="inmates")
    visitor_logs = relationship("VisitorLog", back_populates="inmate")


class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    visitor_id_number = Column(String, index=True, nullable=False)
    visitor_name = Column(String, nullable=False)
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False)
    check_in_time = Column(DateTime, default=get_utc_now, nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    status = Column(String, default="CHECKED_IN", nullable=False)  # CHECKED_IN, COMPLETED
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    inmate = relationship("Inmate", back_populates="visitor_logs")


class VisitorBlacklist(Base):
    __tablename__ = "visitor_blacklists"

    id = Column(String, primary_key=True, default=generate_uuid)
    visitor_id_number = Column(String, unique=True, index=True, nullable=False)
    reason = Column(Text, nullable=False)
    banned_by = Column(String, ForeignKey("users.id"), nullable=True)
    banned_at = Column(DateTime, default=get_utc_now, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    user_role = Column(String, nullable=True)
    action = Column(String, nullable=False)  # e.g., CREATE_INMATE, CELL_ASSIGNMENT, VISITOR_CHECK_IN
    resource_type = Column(String, nullable=False)  # e.g., INMATE, CELL, VISITOR
    resource_id = Column(String, nullable=True)
    payload_before = Column(Text, default="{}", nullable=False)
    payload_after = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, index=True, nullable=False)
