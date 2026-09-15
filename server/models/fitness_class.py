import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship
from server.database import Base


class FitnessClass(Base):
    __tablename__ = "fitness_classes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(150), nullable=False)
    category = Column(
        String(50), nullable=False, index=True
    )  # HIIT, Yoga, Strength, Spin, Pilates
    description = Column(Text, nullable=True)
    instructor_name = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    max_capacity = Column(Integer, nullable=False)
    booked_count = Column(Integer, default=0, nullable=False)
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

    bookings = relationship(
        "ClassBooking", back_populates="fitness_class", cascade="all, delete-orphan"
    )

    @property
    def available_spots(self) -> int:
        return max(0, (self.max_capacity or 0) - (self.booked_count or 0))

    @property
    def is_full(self) -> bool:
        return (self.booked_count or 0) >= (self.max_capacity or 0)
