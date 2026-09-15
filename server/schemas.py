from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class KPIOverview(BaseModel):
    cluster_name: str
    sales_per_linear_ft: float
    private_brand_share_pct: float
    in_stock_rate_pct: float
    shelf_capacity_utilization_pct: float
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SKUItem(BaseModel):
    id: str
    sku_code: str
    name: str
    category: str
    weekly_unit_sales: int
    sales_per_linear_ft: float
    margin_pct: float
    space_allocation_ft: float
    is_private_brand: bool
    status_badge: str

    class Config:
        from_attributes = True


class SKUCreate(BaseModel):
    sku_code: str
    name: str
    category: str = "Snacks"
    weekly_unit_sales: int = 0
    sales_per_linear_ft: float = 0.0
    margin_pct: float = 0.0
    space_allocation_ft: float = 0.0
    is_private_brand: bool = False
    status_badge: str = Field(..., pattern="^(GROW|MAINTAIN|SWAP|REDUCE)$")


class SKUUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    weekly_unit_sales: Optional[int] = None
    sales_per_linear_ft: Optional[float] = None
    margin_pct: Optional[float] = None
    space_allocation_ft: Optional[float] = None
    is_private_brand: Optional[bool] = None
    status_badge: Optional[str] = Field(None, pattern="^(GROW|MAINTAIN|SWAP|REDUCE)$")


class ScenarioOption(BaseModel):
    id: str
    code: str
    title: str
    description: str
    projected_sales_growth_pct: float
    projected_private_brand_share_pct: float
    shelf_space_impact_pct: float
    sku_actions_summary: Dict[str, int]
    is_default: bool

    class Config:
        from_attributes = True


class GuardrailCheck(BaseModel):
    name: str
    passed: bool
    actual_value: str


class ScenarioEvaluateRequest(BaseModel):
    scenario_code: str
    cluster_name: Optional[str] = "Small Town Value Cluster"


class ScenarioEvaluationResponse(BaseModel):
    scenario_code: str
    scenario_title: str
    projected_sales_growth_pct: float
    projected_private_brand_share_pct: float
    shelf_space_impact_pct: float
    sku_actions_summary: Dict[str, int]
    guardrails: List[GuardrailCheck]
    can_submit: bool


class ApprovalSubmitRequest(BaseModel):
    scenario_code: str
    cluster_name: Optional[str] = "Small Town Value Cluster"
    manager_id: Optional[str] = "MGR-8842"
    override_comments: Optional[str] = None


class ApprovalSubmissionResponse(BaseModel):
    audit_id: str
    submitted_at: datetime
    manager_id: str
    scenario_applied: str
    total_sku_actions: int
    guardrails: List[GuardrailCheck]
    status: str
    message: str

    class Config:
        from_attributes = True
