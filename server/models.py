import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    JSON,
    func,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class ChipDefinition(Base):
    __tablename__ = "chip_definitions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True, index=True)
    category = Column(String(50), nullable=False)
    face_value = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVE")
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    batches = relationship(
        "InventoryBatch", back_populates="chip", cascade="all, delete-orphan"
    )
    balances = relationship(
        "AccountBalance", back_populates="chip", cascade="all, delete-orphan"
    )
    transactions = relationship("Transaction", back_populates="chip")


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chip_id = Column(
        String(36), ForeignKey("chip_definitions.id"), nullable=False, index=True
    )
    batch_number = Column(String(50), nullable=False, unique=True, index=True)
    total_quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    allocated_quantity = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="AVAILABLE")
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    chip = relationship("ChipDefinition", back_populates="batches")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_number = Column(String(50), nullable=False, unique=True, index=True)
    owner_name = Column(String(150), nullable=False)
    owner_email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    role = Column(String(30), nullable=False, default="USER")
    status = Column(String(20), nullable=False, default="ACTIVE")
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    balances = relationship(
        "AccountBalance", back_populates="account", cascade="all, delete-orphan"
    )


class AccountBalance(Base):
    __tablename__ = "account_balances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(
        String(36), ForeignKey("accounts.id"), nullable=False, index=True
    )
    chip_id = Column(
        String(36), ForeignKey("chip_definitions.id"), nullable=False, index=True
    )
    balance = Column(Integer, nullable=False, default=0)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("account_id", "chip_id", name="uq_account_chip_balance"),
    )

    account = relationship("Account", back_populates="balances")
    chip = relationship("ChipDefinition", back_populates="balances")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_type = Column(String(30), nullable=False, index=True)
    source_account_id = Column(
        String(36), ForeignKey("accounts.id"), nullable=True, index=True
    )
    destination_account_id = Column(
        String(36), ForeignKey("accounts.id"), nullable=True, index=True
    )
    chip_id = Column(
        String(36), ForeignKey("chip_definitions.id"), nullable=False, index=True
    )
    amount = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="COMPLETED")
    reason = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, server_default=func.now()
    )

    source_account = relationship("Account", foreign_keys=[source_account_id])
    destination_account = relationship("Account", foreign_keys=[destination_account_id])
    chip = relationship("ChipDefinition", back_populates="transactions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, server_default=func.now()
    )
