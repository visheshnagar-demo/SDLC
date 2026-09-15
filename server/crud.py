from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from server.models import SKU, Scenario, ClusterKPI, ApprovalSubmission
from server.schemas import SKUCreate, SKUUpdate


def get_cluster_kpi(db: Session, cluster_name: str = "Small Town Value Cluster") -> Optional[ClusterKPI]:
    return db.query(ClusterKPI).filter(ClusterKPI.cluster_name == cluster_name).first()


def get_skus(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_badge: Optional[str] = None,
    is_private_brand: Optional[bool] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "asc"
) -> List[SKU]:
    query = db.query(SKU)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SKU.sku_code.ilike(search_pattern),
                SKU.name.ilike(search_pattern),
                SKU.category.ilike(search_pattern)
            )
        )

    if status_badge:
        query = query.filter(SKU.status_badge == status_badge.upper())

    if is_private_brand is not None:
        query = query.filter(SKU.is_private_brand == is_private_brand)

    # Sorting
    if sort_by and hasattr(SKU, sort_by):
        column = getattr(SKU, sort_by)
        query = query.order_by(desc(column) if sort_order.lower() == "desc" else asc(column))
    else:
        query = query.order_by(SKU.sku_code.asc())

    return query.offset(skip).limit(limit).all()


def get_sku_by_id(db: Session, sku_id: str) -> Optional[SKU]:
    return db.query(SKU).filter(SKU.id == sku_id).first()


def get_sku_by_code(db: Session, sku_code: str) -> Optional[SKU]:
    return db.query(SKU).filter(SKU.sku_code == sku_code).first()


def create_sku(db: Session, sku_in: SKUCreate) -> SKU:
    db_sku = SKU(**sku_in.model_dump())
    db.add(db_sku)
    db.commit()
    db.refresh(db_sku)
    return db_sku


def update_sku(db: Session, db_sku: SKU, sku_in: SKUUpdate) -> SKU:
    update_data = sku_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_sku, field, value)
    db.commit()
    db.refresh(db_sku)
    return db_sku


def get_scenarios(db: Session) -> List[Scenario]:
    return db.query(Scenario).order_by(Scenario.created_at.asc()).all()


def get_scenario_by_code(db: Session, code: str) -> Optional[Scenario]:
    return db.query(Scenario).filter(Scenario.code == code.upper()).first()


def create_approval_submission(
    db: Session,
    audit_id: str,
    cluster_name: str,
    manager_id: str,
    scenario_code: str,
    scenario_applied: str,
    total_sku_actions: int,
    sku_actions_snapshot: Dict[str, Any],
    guardrail_status_snapshot: List[Dict[str, Any]],
    override_comments: Optional[str] = None,
    status: str = "APPROVED",
    message: Optional[str] = None
) -> ApprovalSubmission:
    submission = ApprovalSubmission(
        audit_id=audit_id,
        cluster_name=cluster_name,
        manager_id=manager_id,
        scenario_code=scenario_code,
        scenario_applied=scenario_applied,
        total_sku_actions=total_sku_actions,
        sku_actions_snapshot=sku_actions_snapshot,
        guardrail_status_snapshot=guardrail_status_snapshot,
        override_comments=override_comments,
        status=status,
        message=message
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def get_approval_submissions(db: Session, skip: int = 0, limit: int = 20) -> List[ApprovalSubmission]:
    return db.query(ApprovalSubmission).order_by(ApprovalSubmission.created_at.desc()).offset(skip).limit(limit).all()


def get_approval_submission_by_audit_id(db: Session, audit_id: str) -> Optional[ApprovalSubmission]:
    return db.query(ApprovalSubmission).filter(ApprovalSubmission.audit_id == audit_id).first()
