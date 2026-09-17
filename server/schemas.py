from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


# Base Schema Config
class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


# Chip Definition Schemas
class ChipDefinitionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    face_value: float = Field(..., ge=0)


class ChipDefinitionUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|RETIRED|SUSPENDED)$")


class InventoryBatchResponse(ORMBase):
    id: str
    chip_id: str
    batch_number: str
    total_quantity: int
    available_quantity: int
    allocated_quantity: int
    status: str
    created_at: datetime
    updated_at: datetime


class ChipDefinitionResponse(ORMBase):
    id: str
    name: str
    category: str
    face_value: float
    status: str
    created_at: datetime
    updated_at: datetime
    total_quantity: int = 0
    available_quantity: int = 0
    allocated_quantity: int = 0
    batches: List[InventoryBatchResponse] = []


class InventoryBatchCreate(BaseModel):
    batch_number: str = Field(..., min_length=1, max_length=50)
    total_quantity: int = Field(..., gt=0)


# Account Schemas
class AccountCreate(BaseModel):
    account_number: str = Field(..., min_length=1, max_length=50)
    owner_name: str = Field(..., min_length=1, max_length=150)
    owner_email: str
    role: str = "USER"
    password: Optional[str] = "testpassword"


class AccountBalanceResponse(ORMBase):
    chip_id: str
    chip_name: Optional[str] = None
    balance: int
    updated_at: datetime


class AccountResponse(ORMBase):
    id: str
    account_number: str
    owner_name: str
    owner_email: str
    role: str
    status: str
    created_at: datetime
    balances: List[AccountBalanceResponse] = []


# Transfer & Allocation Schemas
class AllocationRequest(BaseModel):
    account_id: str
    chip_id: str
    amount: int = Field(..., gt=0)
    reason: str = Field(..., min_length=1, max_length=255)


class TransferRequest(BaseModel):
    source_account_id: str
    destination_account_id: str
    chip_id: str
    amount: int = Field(..., gt=0)
    reason: str = Field(..., min_length=1, max_length=255)


class RedemptionRequest(BaseModel):
    account_id: str
    chip_id: str
    amount: int = Field(..., gt=0)
    reason: str = Field(..., min_length=1, max_length=255)


class TransactionResponse(ORMBase):
    id: str
    transaction_type: str
    source_account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    chip_id: str
    amount: int
    status: str
    reason: str
    created_at: datetime
    source_balance_after: Optional[int] = None
    destination_balance_after: Optional[int] = None


# Audit Log Schemas
class AuditLogResponse(ORMBase):
    id: str
    actor_id: str
    action_type: str
    entity_name: str
    entity_id: str
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime


# Analytics Schema
class DashboardAnalyticsResponse(BaseModel):
    total_circulation: int
    active_accounts: int
    low_stock_count: int
    volume_24h: int
    recent_transactions: List[TransactionResponse] = []
