import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from server.database import Base


class InmateMovement(Base):
    __tablename__ = "inmate_movements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False, index=True)
    source_location = Column(String, nullable=False)
    destination_location = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    escort_officer = Column(String, nullable=False)
    departure_time = Column(DateTime, server_default=func.now(), nullable=False)
    expected_arrival_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="IN_TRANSIT")
    is_overdue = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    inmate = relationship("Inmate", back_populates="movements")
