from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from server.models import AuditLog, Account, AccountBalance, InventoryBatch, Transaction


def query_audit_logs(
    db: Session,
    user_id: Optional[str] = None,
    action_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[AuditLog]:
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.actor_id == user_id)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()


def get_dashboard_analytics(db: Session) -> Dict[str, Any]:
    # Total circulation across all account balances
    total_circulation = (
        db.query(func.coalesce(func.sum(AccountBalance.balance), 0)).scalar() or 0
    )

    # Active accounts count
    active_accounts = db.query(Account).filter(Account.status == "ACTIVE").count()

    # Low stock batch alerts (available_quantity < 1000)
    low_stock_count = (
        db.query(InventoryBatch)
        .filter(
            InventoryBatch.available_quantity < 1000,
            InventoryBatch.status == "AVAILABLE",
        )
        .count()
    )

    # 24h Transaction volume
    time_24h_ago = datetime.utcnow() - timedelta(hours=24)
    volume_24h = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.created_at >= time_24h_ago)
        .scalar()
        or 0
    )

    # Recent transactions
    recent_transactions = (
        db.query(Transaction).order_by(Transaction.created_at.desc()).limit(10).all()
    )

    return {
        "total_circulation": int(total_circulation),
        "active_accounts": int(active_accounts),
        "low_stock_count": int(low_stock_count),
        "volume_24h": int(volume_24h),
        "recent_transactions": recent_transactions,
    }
