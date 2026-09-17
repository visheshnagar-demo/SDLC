from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from server.database import get_db
from server.models import Account, AccountBalance, InventoryBatch, Transaction
from server.schemas import DashboardAnalyticsResponse, TransactionResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # 1. Total circulation
    total_circ = db.query(func.coalesce(func.sum(AccountBalance.balance), 0)).scalar()

    # 2. Active accounts
    active_accs = (
        db.query(func.count(Account.id)).filter(Account.status == "active").scalar()
    )

    # 3. Low stock batches (e.g. available < 1000)
    low_stock = (
        db.query(func.count(InventoryBatch.id))
        .filter(
            InventoryBatch.status == "active", InventoryBatch.available_quantity < 1000
        )
        .scalar()
    )

    # 4. 24h Volume
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    vol_24h = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.created_at >= cutoff)
        .scalar()
    )

    # 5. Recent transactions
    recent_txns = (
        db.query(Transaction).order_by(Transaction.created_at.desc()).limit(10).all()
    )

    return DashboardAnalyticsResponse(
        total_circulation=total_circ,
        active_accounts=active_accs,
        low_stock_count=low_stock,
        volume_24h=vol_24h,
        recent_transactions=[
            TransactionResponse.model_validate(t) for t in recent_txns
        ],
    )
