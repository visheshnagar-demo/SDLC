import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from server.database import Base


class HousingUnit(Base):
    __tablename__ = "housing_units"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_name = Column(String, unique=True, nullable=False, index=True)
    security_level = Column(String, nullable=False, default="medium")
    capacity = Column(Integer, nullable=False, default=50)
    current_occupancy = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    cell_assignments = relationship("CellAssignment", back_populates="unit")


class CellAssignment(Base):
    __tablename__ = "cell_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False, index=True)
    unit_id = Column(String, ForeignKey("housing_units.id"), nullable=False, index=True)
    cell_number = Column(String, nullable=False)
    assigned_at = Column(DateTime, server_default=func.now(), nullable=False)
    unassigned_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    override_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    inmate = relationship("Inmate", back_populates="cell_assignments")
    unit = relationship("HousingUnit", back_populates="cell_assignments")


class KeepAwayRule(Base):
    __tablename__ = "keep_away_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False, index=True)
    keep_away_inmate_id = Column(
        String, ForeignKey("inmates.id"), nullable=False, index=True
    )
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    inmate = relationship("Inmate", foreign_keys=[inmate_id])
    keep_away_inmate = relationship("Inmate", foreign_keys=[keep_away_inmate_id])
