import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class InventoryStock(Base):
    __tablename__ = "inventory_stock"
    __table_args__ = (
        UniqueConstraint("item_id", "warehouse_id", name="uq_item_warehouse"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    item_id = Column(String, ForeignKey("items.id"), index=True, nullable=False)
    warehouse_id = Column(
        String, ForeignKey("warehouses.id"), index=True, nullable=False
    )
    quantity_on_hand = Column(Integer, default=0, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    item = relationship("Item", back_populates="inventory_stocks")
    warehouse = relationship("Warehouse", back_populates="inventory_stocks")
