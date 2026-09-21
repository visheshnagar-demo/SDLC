import uuid
import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(String, primary_key=True, default=generate_uuid)
    item_id = Column(String, ForeignKey("items.id"), index=True, nullable=False)
    warehouse_id = Column(
        String, ForeignKey("warehouses.id"), index=True, nullable=False
    )
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=True)
    previous_quantity = Column(Integer, nullable=False)
    quantity_delta = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    reason_code = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True, nullable=False)

    item = relationship("Item", back_populates="stock_adjustments")
    warehouse = relationship("Warehouse", back_populates="stock_adjustments")
    user = relationship("User")
