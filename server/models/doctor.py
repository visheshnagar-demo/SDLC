import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Time,
    func,
)
from sqlalchemy.orm import relationship
from server.models import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    doctor_code = Column(String(32), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    qualification = Column(String(150), nullable=False)
    consultation_fee = Column(Numeric(10, 2), nullable=False, default=0.00)
    slot_duration_minutes = Column(Integer, nullable=False, default=30)
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", foreign_keys=[user_id])
    schedules = relationship(
        "DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan"
    )
    appointments = relationship(
        "Appointment", back_populates="doctor", cascade="all, delete-orphan"
    )


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0 (Monday) to 6 (Sunday)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    doctor = relationship("Doctor", back_populates="schedules")
