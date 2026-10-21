import uuid
from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from server.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    doctor_code = Column(String(32), unique=True, nullable=False)
    department = Column(String(100), index=True, nullable=False)
    qualification = Column(String(150), nullable=False)
    consultation_fee = Column(Float, nullable=False, default=0.0)
    slot_duration_minutes = Column(Integer, nullable=False, default=30)
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    schedules = relationship("DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String(36), ForeignKey("doctors.id"), index=True, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time = Column(String(20), nullable=False)  # "09:00:00"
    end_time = Column(String(20), nullable=False)    # "17:00:00"
    is_active = Column(Boolean, nullable=False, default=True)

    doctor = relationship("Doctor", back_populates="schedules")
