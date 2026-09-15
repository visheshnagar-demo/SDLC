import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from server.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class SKU(Base):
    __tablename__ = "skus"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    sku_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Snacks", nullable=False)
    weekly_unit_sales = Column(Integer, default=0, nullable=False)
    sales_per_linear_ft = Column(Float, default=0.0, nullable=False)
    margin_pct = Column(Float, default=0.0, nullable=False)
    space_allocation_ft = Column(Float, default=0.0, nullable=False)
    is_private_brand = Column(Boolean, default=False, nullable=False)
    status_badge = Column(String(20), nullable=False)  # 'GROW', 'MAINTAIN', 'SWAP', 'REDUCE'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # 'CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    projected_sales_growth_pct = Column(Float, default=0.0, nullable=False)
    projected_private_brand_share_pct = Column(Float, default=0.0, nullable=False)
    shelf_space_impact_pct = Column(Float, default=0.0, nullable=False)
    sku_actions_summary = Column(JSON, nullable=False)  # {"grow": 4, "maintain": 12, "swap": 3, "reduce": 2}
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ClusterKPI(Base):
    __tablename__ = "cluster_kpis"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    cluster_name = Column(String(100), unique=True, index=True, nullable=False)
    sales_per_linear_ft = Column(Float, default=0.0, nullable=False)
    private_brand_share_pct = Column(Float, default=0.0, nullable=False)
    in_stock_rate_pct = Column(Float, default=0.0, nullable=False)
    shelf_capacity_utilization_pct = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ApprovalSubmission(Base):
    __tablename__ = "approval_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    audit_id = Column(String(100), unique=True, index=True, nullable=False)
    cluster_name = Column(String(100), nullable=False)
    manager_id = Column(String(100), nullable=False)
    scenario_code = Column(String(50), nullable=False)
    scenario_applied = Column(String(100), nullable=False)
    total_sku_actions = Column(Integer, default=0, nullable=False)
    sku_actions_snapshot = Column(JSON, nullable=False)
    guardrail_status_snapshot = Column(JSON, nullable=False)
    override_comments = Column(Text, nullable=True)
    status = Column(String(50), default="APPROVED", nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
