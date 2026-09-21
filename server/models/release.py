import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from server.database import Base


class Release(Base):
    __tablename__ = "releases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False, index=True)
    discharge_order_verified = Column(Boolean, nullable=False, default=False)
    property_returned = Column(Boolean, nullable=False, default=False)
    victim_notified = Column(Boolean, nullable=False, default=False)
    authorized_by = Column(String, nullable=True)
    release_time = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="DISCHARGED")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    inmate = relationship("Inmate", back_populates="releases")


class ReleaseHold(Base):
    __tablename__ = "release_holds"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False, index=True)
    hold_type = Column(String, nullable=False)
    issuing_agency = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    cleared_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    inmate = relationship("Inmate", back_populates="release_holds")
