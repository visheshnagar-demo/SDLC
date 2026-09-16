from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Date, DateTime
from server.database import Base


class RawSalesOrder(Base):
    """
    Source raw sales orders table in PostgreSQL.
    """

    __tablename__ = "raw_sales_orders"

    order_id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), nullable=True, index=True)
    customer_email = Column(String(255), nullable=True)
    order_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(3), nullable=True, default="USD")
    status = Column(String(32), nullable=True, default="pending")
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
