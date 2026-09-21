import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from server.database import Base


class InventoryStock(Base):
    __tablename__ = "inventory_stock"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String(36), ForeignKey("items.id"), nullable=False, index=True)
    warehouse_id = Column(
        String(36), ForeignKey("warehouses.id"), nullable=False, index=True
    )
    quantity_on_hand = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("item_id", "warehouse_id", name="uq_item_warehouse"),
    )

    item = relationship("Item", back_populates="inventory_stocks")
    warehouse = relationship("Warehouse", back_populates="inventory_stocks")
