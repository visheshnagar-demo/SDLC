import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from server.database import Base


class ClassBooking(Base):
    __tablename__ = "class_bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    class_id = Column(
        String(36),
        ForeignKey("fitness_classes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        String(20), default="CONFIRMED", nullable=False
    )  # CONFIRMED, CANCELLED
    booked_at = Column(
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

    user = relationship("User", back_populates="bookings")
    fitness_class = relationship("FitnessClass", back_populates="bookings")
