import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.orm import relationship
from server.database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True, index=True)
    unit_price = Column(Float, nullable=False, default=0.0)
    reorder_threshold = Column(Integer, nullable=False, default=10)
    reorder_quantity = Column(Integer, nullable=False, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inventory_stocks = relationship(
        "InventoryStock", back_populates="item", cascade="all, delete-orphan"
    )
    adjustments = relationship(
        "StockAdjustment", back_populates="item", cascade="all, delete-orphan"
    )
