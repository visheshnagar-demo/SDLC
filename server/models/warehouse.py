import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from server.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    inventory_stocks = relationship(
        "InventoryStock", back_populates="warehouse", cascade="all, delete-orphan"
    )
    adjustments = relationship(
        "StockAdjustment", back_populates="warehouse", cascade="all, delete-orphan"
    )
