import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class Item(Base):
    __tablename__ = "items"

    id = Column(String, primary_key=True, default=generate_uuid)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=True)
    unit_price = Column(Float, default=0.0, nullable=False)
    reorder_threshold = Column(Integer, default=10, nullable=False)
    reorder_quantity = Column(Integer, default=50, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    inventory_stocks = relationship(
        "InventoryStock", back_populates="item", cascade="all, delete-orphan"
    )
    stock_adjustments = relationship(
        "StockAdjustment", back_populates="item", cascade="all, delete-orphan"
    )
