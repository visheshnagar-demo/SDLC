import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String(36), ForeignKey("items.id"), nullable=False, index=True)
    warehouse_id = Column(
        String(36), ForeignKey("warehouses.id"), nullable=False, index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    previous_quantity = Column(Integer, nullable=False)
    quantity_delta = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    reason_code = Column(String(50), nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    item = relationship("Item", back_populates="adjustments")
    warehouse = relationship("Warehouse", back_populates="adjustments")
    user = relationship("User")
