from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.inventory import StockAdjustmentCreate, StockAdjustmentResponse
from server.routers.inventory import _process_adjustment, list_audit_logs

router = APIRouter(prefix="/adjustments", tags=["adjustments"])


@router.get("", response_model=List[StockAdjustmentResponse])
def get_adjustments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    item_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return list_audit_logs(
        skip=skip, limit=limit, item_id=item_id, warehouse_id=warehouse_id, db=db
    )


@router.post(
    "", response_model=StockAdjustmentResponse, status_code=status.HTTP_201_CREATED
)
def create_adjustment(adj_in: StockAdjustmentCreate, db: Session = Depends(get_db)):
    if not adj_in.item_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="item_id is required in request body",
        )
    return _process_adjustment(adj_in.item_id, adj_in, db)
