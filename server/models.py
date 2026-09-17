import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from server.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_number = Column(String(50), unique=True, nullable=False, index=True)
    owner_name = Column(String(100), nullable=False)
    owner_email = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(String(20), nullable=False, default="user")
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    balances = relationship(
        "AccountBalance", back_populates="account", cascade="all, delete-orphan"
    )


class ChipDefinition(Base):
    __tablename__ = "chip_definitions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    face_value = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    batches = relationship(
        "InventoryBatch", back_populates="chip", cascade="all, delete-orphan"
    )
    balances = relationship(
        "AccountBalance", back_populates="chip", cascade="all, delete-orphan"
    )


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chip_id = Column(String(36), ForeignKey("chip_definitions.id"), nullable=False)
    batch_number = Column(String(50), unique=True, nullable=False, index=True)
    total_quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    allocated_quantity = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chip = relationship("ChipDefinition", back_populates="batches")


class AccountBalance(Base):
    __tablename__ = "account_balances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    chip_id = Column(String(36), ForeignKey("chip_definitions.id"), nullable=False)
    balance = Column(Integer, nullable=False, default=0)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    account = relationship("Account", back_populates="balances")
    chip = relationship("ChipDefinition", back_populates="balances")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_type = Column(
        String(50), nullable=False
    )  # transfer, allocate, redeem, adjustment
    source_account_id = Column(String(36), ForeignKey("accounts.id"), nullable=True)
    destination_account_id = Column(
        String(36), ForeignKey("accounts.id"), nullable=True
    )
    chip_id = Column(String(36), ForeignKey("chip_definitions.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="completed")
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source_account = relationship("Account", foreign_keys=[source_account_id])
    destination_account = relationship("Account", foreign_keys=[destination_account_id])
    chip = relationship("ChipDefinition")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("accounts.id"), nullable=True)
    action_type = Column(String(50), nullable=False)
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    actor = relationship("Account")
