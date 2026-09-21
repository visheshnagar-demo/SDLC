from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models.item import Item
from server.models.warehouse import Warehouse
from server.models.audit_log import StockAdjustment
from server.routers.inventory import process_adjustment
from server.schemas.inventory import StockAdjustmentCreate
from server.schemas.audit_log import StockAdjustmentResponse

router = APIRouter(tags=["adjustments"])


@router.post(
    "/api/v1/stock-adjustments",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/api/v1/adjustments",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_adjustment(adj_in: StockAdjustmentCreate, db: Session = Depends(get_db)):
    adjustment = process_adjustment(db, adj_in.item_id, adj_in)
    item = db.query(Item).get(adjustment.item_id)
    wh = db.query(Warehouse).get(adjustment.warehouse_id)
    return StockAdjustmentResponse(
        id=adjustment.id,
        item_id=adjustment.item_id,
        warehouse_id=adjustment.warehouse_id,
        user_id=adjustment.user_id,
        previous_quantity=adjustment.previous_quantity,
        quantity_delta=adjustment.quantity_delta,
        new_quantity=adjustment.new_quantity,
        reason_code=adjustment.reason_code,
        notes=adjustment.notes,
        created_at=adjustment.created_at,
        sku=item.sku if item else None,
        item_name=item.name if item else None,
        warehouse_name=wh.name if wh else None,
    )


@router.get("/api/v1/stock-adjustments", response_model=List[StockAdjustmentResponse])
@router.get("/api/v1/adjustments", response_model=List[StockAdjustmentResponse])
def list_adjustments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    item_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(StockAdjustment, Item, Warehouse)
        .join(Item, StockAdjustment.item_id == Item.id)
        .join(Warehouse, StockAdjustment.warehouse_id == Warehouse.id)
    )

    if item_id:
        query = query.filter(
            or_(StockAdjustment.item_id == item_id, Item.sku == item_id)
        )
    if warehouse_id:
        query = query.filter(
            or_(
                StockAdjustment.warehouse_id == warehouse_id,
                Warehouse.code == warehouse_id,
            )
        )

    logs = (
        query.order_by(StockAdjustment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    response = []
    for adj, item, wh in logs:
        res = StockAdjustmentResponse(
            id=adj.id,
            item_id=adj.item_id,
            warehouse_id=adj.warehouse_id,
            user_id=adj.user_id,
            previous_quantity=adj.previous_quantity,
            quantity_delta=adj.quantity_delta,
            new_quantity=adj.new_quantity,
            reason_code=adj.reason_code,
            notes=adj.notes,
            created_at=adj.created_at,
            sku=item.sku,
            item_name=item.name,
            warehouse_name=wh.name,
        )
        response.append(res)
    return response
