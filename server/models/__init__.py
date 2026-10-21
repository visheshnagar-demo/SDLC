import uuid
from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

from server.models.user import User
from server.models.patient import Patient
from server.models.doctor import Doctor, DoctorSchedule
from server.models.appointment import Appointment
from server.models.clinical_record import ClinicalRecord
from server.models.audit_log import AuditLog

__all__ = [
    "Base",
    "User",
    "Patient",
    "Doctor",
    "DoctorSchedule",
    "Appointment",
    "ClinicalRecord",
    "AuditLog",
]
