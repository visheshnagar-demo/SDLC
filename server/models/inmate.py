import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from server.database import Base


class Inmate(Base):
    __tablename__ = "inmates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String, nullable=False, index=True)
    last_name = Column(String, nullable=False, index=True)
    date_of_birth = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    ssn = Column(String, nullable=True)
    ssn_hash = Column(String, nullable=True, index=True)
    booking_number = Column(String, unique=True, index=True, nullable=False)
    security_level = Column(String, nullable=False, default="MEDIUM")
    gang_affiliation = Column(String, nullable=True)
    medical_alerts = Column(Text, nullable=True)
    mugshot_url = Column(Text, nullable=True)
    fingerprint_hash = Column(String, nullable=True)
    status = Column(String, nullable=False, default="BOOKED")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    charges = relationship(
        "Charge", back_populates="inmate", cascade="all, delete-orphan"
    )
    property_items = relationship(
        "PropertyItem", back_populates="inmate", cascade="all, delete-orphan"
    )
    cell_assignments = relationship(
        "CellAssignment", back_populates="inmate", cascade="all, delete-orphan"
    )
    movements = relationship(
        "InmateMovement", back_populates="inmate", cascade="all, delete-orphan"
    )
    releases = relationship(
        "Release", back_populates="inmate", cascade="all, delete-orphan"
    )
    release_holds = relationship(
        "ReleaseHold", back_populates="inmate", cascade="all, delete-orphan"
    )


class Charge(Base):
    __tablename__ = "charges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False, index=True)
    charge_code = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False, default="FELONY")
    status = Column(String, nullable=False, default="ACTIVE")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    inmate = relationship("Inmate", back_populates="charges")


class PropertyItem(Base):
    __tablename__ = "property_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inmate_id = Column(String, ForeignKey("inmates.id"), nullable=False, index=True)
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    condition = Column(String, nullable=True)
    location = Column(String, nullable=True, default="Property Locker A")
    status = Column(String, nullable=False, default="STORED")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    inmate = relationship("Inmate", back_populates="property_items")
