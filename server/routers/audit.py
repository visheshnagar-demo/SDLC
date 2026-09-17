from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import AuditLogResponse
from server.services.audit_service import query_audit_logs

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Logs"])


@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    user_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None, alias="action_type"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return query_audit_logs(
        db,
        user_id=user_id,
        action_type=type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
