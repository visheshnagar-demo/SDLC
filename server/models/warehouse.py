import uuid
import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    inventory_stocks = relationship(
        "InventoryStock", back_populates="warehouse", cascade="all, delete-orphan"
    )
    stock_adjustments = relationship(
        "StockAdjustment", back_populates="warehouse", cascade="all, delete-orphan"
    )
