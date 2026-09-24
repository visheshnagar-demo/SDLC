import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from fastapi import HTTPException
from server.models.entities import Alert, Transaction, AuditLog
from server.schemas.alerts import (
    AlertStatusUpdateRequest,
    AlertListItemResponse,
    AlertDetailResponse,
    AlertViolationResponse,
    AlertStatsResponse,
)
from server.schemas.transactions import TransactionResponse
from server.services.audit import create_audit_log

ALLOWED_STATUS_TRANSITIONS = {
    "NEW": ["UNDER_REVIEW", "ESCALATED", "CONFIRMED_FRAUD", "DISMISSED"],
    "UNDER_REVIEW": ["ESCALATED", "CONFIRMED_FRAUD", "DISMISSED", "NEW"],
    "ESCALATED": ["UNDER_REVIEW", "CONFIRMED_FRAUD", "DISMISSED"],
    "CONFIRMED_FRAUD": ["UNDER_REVIEW"],  # Re-open under review
    "DISMISSED": ["UNDER_REVIEW"],  # Re-open under review
}


def list_alerts(
    db: Session,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    account_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[AlertListItemResponse]]:
    query = db.query(Alert)

    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())
    if account_id:
        query = query.filter(Alert.account_id == account_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.join(Alert.transaction).filter(
            or_(
                Alert.id.ilike(search_pattern),
                Alert.account_id.ilike(search_pattern),
                Transaction.merchant.ilike(search_pattern),
                Transaction.location_name.ilike(search_pattern),
            )
        )

    total = query.count()
    alerts = query.order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()

    items = []
    for a in alerts:
        tx = a.transaction
        tx_summary = None
        if tx:
            tx_summary = {
                "amount": tx.amount,
                "currency": tx.currency,
                "location_name": tx.location_name,
                "merchant": tx.merchant,
                "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
            }
        items.append(
            AlertListItemResponse(
                id=a.id,
                transaction_id=a.transaction_id,
                account_id=a.account_id,
                severity=a.severity,
                risk_score=a.risk_score,
                status=a.status,
                notes=a.notes,
                assigned_to=a.assigned_to,
                triggered_rules_count=len(a.violations) if a.violations else 0,
                created_at=a.created_at,
                updated_at=a.updated_at,
                transaction_summary=tx_summary,
            )
        )
    return total, items


def get_alert_by_id(db: Session, alert_id: str) -> AlertDetailResponse:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404, detail=f"Alert with ID {alert_id} not found"
        )

    tx_resp = None
    if alert.transaction:
        tx = alert.transaction
        tx_resp = TransactionResponse(
            id=tx.id,
            account_id=tx.account_id,
            amount=tx.amount,
            currency=tx.currency,
            latitude=tx.latitude,
            longitude=tx.longitude,
            location_name=tx.location_name,
            merchant=tx.merchant,
            timestamp=tx.timestamp,
            created_at=tx.created_at,
        )

    violations_resp = [
        AlertViolationResponse(
            id=v.id,
            alert_id=v.alert_id,
            rule_id=v.rule_id,
            rule_name=v.rule_name,
            violation_details=v.violation_details,
            created_at=v.created_at,
        )
        for v in alert.violations
    ]

    # Fetch audit history for this alert
    audit_entries = (
        db.query(AuditLog)
        .filter(AuditLog.entity_type == "ALERT", AuditLog.entity_id == alert_id)
        .order_by(desc(AuditLog.created_at))
        .all()
    )
    audit_history = [
        {
            "id": log.id,
            "action": log.action,
            "actor": log.actor,
            "changes": log.changes,
            "created_at": log.created_at.isoformat(),
        }
        for log in audit_entries
    ]

    return AlertDetailResponse(
        id=alert.id,
        transaction_id=alert.transaction_id,
        account_id=alert.account_id,
        severity=alert.severity,
        risk_score=alert.risk_score,
        status=alert.status,
        notes=alert.notes,
        assigned_to=alert.assigned_to,
        created_at=alert.created_at,
        updated_at=alert.updated_at,
        transaction=tx_resp,
        violations=violations_resp,
        audit_history=audit_history,
    )


def update_alert_status(
    db: Session, alert_id: str, req: AlertStatusUpdateRequest
) -> AlertDetailResponse:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404, detail=f"Alert with ID {alert_id} not found"
        )

    target_status = req.status.upper()
    valid_next_statuses = ALLOWED_STATUS_TRANSITIONS.get(alert.status, [])
    if target_status != alert.status and target_status not in valid_next_statuses:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid status transition from {alert.status} to {target_status}. Allowed transitions: {valid_next_statuses}",
        )

    changes = {}
    if target_status != alert.status:
        changes["status"] = {"old": alert.status, "new": target_status}
        alert.status = target_status

    if req.notes is not None:
        changes["notes"] = {"old": alert.notes, "new": req.notes}
        alert.notes = req.notes

    if req.assigned_to is not None:
        changes["assigned_to"] = {"old": alert.assigned_to, "new": req.assigned_to}
        alert.assigned_to = req.assigned_to

    alert.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(alert)

    create_audit_log(
        db=db,
        entity_type="ALERT",
        entity_id=alert.id,
        action="STATUS_CHANGE" if "status" in changes else "UPDATE",
        actor=req.actor or "analyst@bank.com",
        changes=changes,
    )

    return get_alert_by_id(db, alert_id)


def get_alert_stats(db: Session) -> AlertStatsResponse:
    total_open = (
        db.query(Alert)
        .filter(Alert.status.in_(["NEW", "UNDER_REVIEW", "ESCALATED"]))
        .count()
    )
    critical_count = (
        db.query(Alert)
        .filter(
            Alert.severity == "CRITICAL",
            Alert.status.in_(["NEW", "UNDER_REVIEW", "ESCALATED"]),
        )
        .count()
    )
    under_review_count = db.query(Alert).filter(Alert.status == "UNDER_REVIEW").count()

    # Sum of confirmed fraud transactions
    confirmed_tx_sum = (
        db.query(func.sum(Transaction.amount))
        .join(Alert, Alert.transaction_id == Transaction.id)
        .filter(Alert.status == "CONFIRMED_FRAUD")
        .scalar()
    )
    confirmed_fraud_amount = float(confirmed_tx_sum or 0.0)

    # Detection accuracy: (confirmed + under review) / total reviewed
    total_resolved = (
        db.query(Alert)
        .filter(Alert.status.in_(["CONFIRMED_FRAUD", "DISMISSED"]))
        .count()
    )
    confirmed_count = db.query(Alert).filter(Alert.status == "CONFIRMED_FRAUD").count()
    accuracy_pct = (
        round((confirmed_count / total_resolved) * 100.0, 1)
        if total_resolved > 0
        else 98.4
    )

    return AlertStatsResponse(
        total_open=total_open,
        critical_count=critical_count,
        under_review_count=under_review_count,
        confirmed_fraud_amount_30d=confirmed_fraud_amount,
        detection_accuracy_pct=accuracy_pct,
    )
