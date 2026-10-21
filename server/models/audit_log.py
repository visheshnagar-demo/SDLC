import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from server.models import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(
        String(50), nullable=False
    )  # PATIENT, APPOINTMENT, CLINICAL_RECORD, DOCTOR, AUTH
    resource_id = Column(String(64), nullable=False)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    details = Column(Text, nullable=True)
