from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# --- Chip Schemas ---
class ChipDefinitionBase(BaseModel):
    name: str
    category: str
    face_value: float
    status: str = "active"


class ChipDefinitionCreate(ChipDefinitionBase):
    pass


class ChipDefinitionStatusUpdate(BaseModel):
    status: str


class ChipDefinitionResponse(ChipDefinitionBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_stock: int = 0
    available_stock: int = 0

    model_config = ConfigDict(from_attributes=True)


class InventoryBatchCreate(BaseModel):
    batch_number: str
    total_quantity: int
    status: str = "active"


class InventoryBatchResponse(BaseModel):
    id: str
    chip_id: str
    batch_number: str
    total_quantity: int
    available_quantity: int
    allocated_quantity: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Account Schemas ---
class AccountBase(BaseModel):
    account_number: str
    owner_name: str
    owner_email: str
    role: str = "user"
    status: str = "active"


class AccountCreate(AccountBase):
    pass


class AccountBalanceResponse(BaseModel):
    id: str
    account_id: str
    chip_id: str
    balance: int
    updated_at: datetime
    chip_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AccountResponse(AccountBase):
    id: str
    created_at: datetime
    balances: List[AccountBalanceResponse] = []

    model_config = ConfigDict(from_attributes=True)


class BalanceBreakdownResponse(BaseModel):
    account_id: str
    account_number: str
    owner_name: str
    total_balance: int
    balances: List[AccountBalanceResponse]


# --- Transfer & Allocation Schemas ---
class AllocateRequest(BaseModel):
    target_account_id: str
    chip_id: str
    amount: int = Field(gt=0, description="Amount must be greater than 0")
    reason: Optional[str] = "Inventory allocation"
    actor_id: Optional[str] = None


class TransferRequest(BaseModel):
    source_account_id: str
    destination_account_id: str
    chip_id: str
    amount: int = Field(gt=0, description="Amount must be greater than 0")
    reason: Optional[str] = "Account transfer"
    actor_id: Optional[str] = None


class RedeemRequest(BaseModel):
    account_id: str
    chip_id: str
    amount: int = Field(gt=0, description="Amount must be greater than 0")
    reason: Optional[str] = "Chip redemption"
    actor_id: Optional[str] = None


class AdjustRequest(BaseModel):
    account_id: str
    chip_id: str
    amount: int = Field(description="Adjustment amount (positive or negative)")
    reason: str = "Manual adjustment"
    actor_id: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    transaction_type: str
    source_account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    chip_id: str
    amount: int
    status: str
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Audit Schemas ---
class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action_type: str
    entity_name: str
    entity_id: Optional[str] = None
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Analytics Schemas ---
class DashboardAnalyticsResponse(BaseModel):
    total_circulation: int
    active_accounts: int
    low_stock_count: int
    volume_24h: int
    recent_transactions: List[TransactionResponse] = []
