from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.item import Item
from server.models.warehouse import Warehouse
from server.models.inventory import InventoryStock
from server.models.audit_log import StockAdjustment
from server.schemas.inventory import (
    StockAdjustmentCreate,
    StockTransferCreate,
    InventoryStockResponse,
    StockAdjustmentResponse,
    StockTransferResponse,
)
from server.schemas.alert import LowStockAlertResponse

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _get_default_warehouse_id(db: Session) -> str:
    wh = db.query(Warehouse).first()
    if not wh:
        wh = Warehouse(code="WH-MAIN", name="Main Warehouse", location="Central Hub")
        db.add(wh)
        db.commit()
        db.refresh(wh)
    return wh.id


@router.get("", response_model=List[InventoryStockResponse])
def list_inventory_stock(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[str] = None,
    item_id: Optional[str] = None,
    is_low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(InventoryStock)
        .join(Item, InventoryStock.item_id == Item.id)
        .join(Warehouse, InventoryStock.warehouse_id == Warehouse.id)
    )

    if warehouse_id:
        query = query.filter(
            (InventoryStock.warehouse_id == warehouse_id)
            | (Warehouse.code == warehouse_id)
        )
    if item_id:
        query = query.filter(
            (InventoryStock.item_id == item_id) | (Item.sku == item_id)
        )
    if is_low_stock:
        query = query.filter(InventoryStock.quantity_on_hand < Item.reorder_threshold)

    stocks = (
        query.order_by(InventoryStock.updated_at.desc()).offset(skip).limit(limit).all()
    )

    results = []
    for s in stocks:
        res = InventoryStockResponse(
            id=s.id,
            item_id=s.item_id,
            warehouse_id=s.warehouse_id,
            quantity_on_hand=s.quantity_on_hand,
            updated_at=s.updated_at,
            item_sku=s.item.sku if s.item else None,
            item_name=s.item.name if s.item else None,
            warehouse_code=s.warehouse.code if s.warehouse else None,
            warehouse_name=s.warehouse.name if s.warehouse else None,
        )
        results.append(res)
    return results


@router.get("/low-stock", response_model=List[LowStockAlertResponse])
def list_low_stock_items(db: Session = Depends(get_db)):
    stocks = (
        db.query(InventoryStock)
        .join(Item, InventoryStock.item_id == Item.id)
        .join(Warehouse, InventoryStock.warehouse_id == Warehouse.id)
        .filter(InventoryStock.quantity_on_hand < Item.reorder_threshold)
        .all()
    )
    alerts = []
    for s in stocks:
        deficit = s.item.reorder_threshold - s.quantity_on_hand
        alerts.append(
            LowStockAlertResponse(
                item_id=s.item_id,
                sku=s.item.sku,
                item_name=s.item.name,
                warehouse_id=s.warehouse_id,
                warehouse_name=s.warehouse.name,
                current_stock=s.quantity_on_hand,
                reorder_threshold=s.item.reorder_threshold,
                deficit=deficit if deficit > 0 else 0,
                suggested_reorder_quantity=s.item.reorder_quantity,
                status="CRITICAL" if s.quantity_on_hand == 0 else "LOW_STOCK",
            )
        )
    return alerts


def _process_adjustment(
    item_id_or_sku: str,
    adj_in: StockAdjustmentCreate,
    db: Session,
) -> StockAdjustmentResponse:
    item = db.query(Item).filter(Item.id == item_id_or_sku).first()
    if not item:
        item = db.query(Item).filter(Item.sku == item_id_or_sku).first()
    if not item and adj_in.item_id:
        item = db.query(Item).filter(Item.id == adj_in.item_id).first()
        if not item:
            item = db.query(Item).filter(Item.sku == adj_in.item_id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    target_warehouse_id = adj_in.warehouse_id
    if not target_warehouse_id:
        target_warehouse_id = _get_default_warehouse_id(db)

    wh = db.query(Warehouse).filter(Warehouse.id == target_warehouse_id).first()
    if not wh:
        wh = db.query(Warehouse).filter(Warehouse.code == target_warehouse_id).first()
    if not wh:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found",
        )
    target_warehouse_id = wh.id

    stock = (
        db.query(InventoryStock)
        .filter(
            InventoryStock.item_id == item.id,
            InventoryStock.warehouse_id == target_warehouse_id,
        )
        .first()
    )
    if not stock:
        stock = InventoryStock(
            item_id=item.id,
            warehouse_id=target_warehouse_id,
            quantity_on_hand=0,
        )
        db.add(stock)
        db.flush()

    previous_quantity = stock.quantity_on_hand

    if adj_in.quantity_delta is not None:
        delta = adj_in.quantity_delta
    elif adj_in.quantity is not None and adj_in.adjustment_type:
        adj_type = adj_in.adjustment_type.upper()
        if adj_type == "SET":
            delta = adj_in.quantity - previous_quantity
        elif adj_type in ("ADD", "INCREMENT"):
            delta = adj_in.quantity
        elif adj_type in ("REMOVE", "DECREMENT"):
            delta = -abs(adj_in.quantity)
        else:
            delta = adj_in.quantity
    elif adj_in.quantity is not None:
        delta = adj_in.quantity
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Must provide quantity_delta or quantity and adjustment_type",
        )

    new_quantity = previous_quantity + delta
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock: current stock ({previous_quantity}) cannot be reduced by {-delta}",
        )

    stock.quantity_on_hand = new_quantity

    adjustment = StockAdjustment(
        item_id=item.id,
        warehouse_id=target_warehouse_id,
        user_id=adj_in.user_id,
        previous_quantity=previous_quantity,
        quantity_delta=delta,
        new_quantity=new_quantity,
        reason_code=adj_in.reason_code,
        notes=adj_in.notes,
    )
    db.add(adjustment)
    db.commit()
    db.refresh(adjustment)

    return StockAdjustmentResponse(
        id=adjustment.id,
        item_id=item.id,
        warehouse_id=target_warehouse_id,
        user_id=adjustment.user_id,
        previous_quantity=previous_quantity,
        quantity_delta=delta,
        new_quantity=new_quantity,
        reason_code=adjustment.reason_code,
        notes=adjustment.notes,
        created_at=adjustment.created_at,
        item_sku=item.sku,
        item_name=item.name,
        warehouse_name=wh.name,
    )


@router.post(
    "/adjust",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_adjustment_generic(
    adj_in: StockAdjustmentCreate, db: Session = Depends(get_db)
):
    if not adj_in.item_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="item_id is required in request body",
        )
    return _process_adjustment(adj_in.item_id, adj_in, db)


@router.post(
    "/{item_id}/adjust",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_adjustment_by_item(
    item_id: str, adj_in: StockAdjustmentCreate, db: Session = Depends(get_db)
):
    return _process_adjustment(item_id, adj_in, db)


@router.post(
    "/transfer",
    response_model=StockTransferResponse,
    status_code=status.HTTP_201_CREATED,
)
def transfer_stock(transfer_in: StockTransferCreate, db: Session = Depends(get_db)):
    if transfer_in.from_warehouse_id == transfer_in.to_warehouse_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and destination warehouses must be different",
        )

    item = (
        db.query(Item)
        .filter((Item.id == transfer_in.item_id) | (Item.sku == transfer_in.item_id))
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )

    from_wh = (
        db.query(Warehouse)
        .filter(
            (Warehouse.id == transfer_in.from_warehouse_id)
            | (Warehouse.code == transfer_in.from_warehouse_id)
        )
        .first()
    )
    if not from_wh:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source warehouse not found"
        )

    to_wh = (
        db.query(Warehouse)
        .filter(
            (Warehouse.id == transfer_in.to_warehouse_id)
            | (Warehouse.code == transfer_in.to_warehouse_id)
        )
        .first()
    )
    if not to_wh:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination warehouse not found",
        )

    # Perform source warehouse deduction
    source_adj = _process_adjustment(
        item.id,
        StockAdjustmentCreate(
            item_id=item.id,
            warehouse_id=from_wh.id,
            quantity_delta=-transfer_in.quantity,
            reason_code=f"TRANSFER_OUT_{transfer_in.reason_code}",
            notes=f"Transfer to warehouse {to_wh.name}. {transfer_in.notes or ''}".strip(),
            user_id=transfer_in.user_id,
        ),
        db,
    )

    # Perform destination warehouse addition
    dest_adj = _process_adjustment(
        item.id,
        StockAdjustmentCreate(
            item_id=item.id,
            warehouse_id=to_wh.id,
            quantity_delta=transfer_in.quantity,
            reason_code=f"TRANSFER_IN_{transfer_in.reason_code}",
            notes=f"Transfer from warehouse {from_wh.name}. {transfer_in.notes or ''}".strip(),
            user_id=transfer_in.user_id,
        ),
        db,
    )

    return StockTransferResponse(
        item_id=item.id,
        item_sku=item.sku,
        from_warehouse_id=from_wh.id,
        from_warehouse_name=from_wh.name,
        to_warehouse_id=to_wh.id,
        to_warehouse_name=to_wh.name,
        quantity_transferred=transfer_in.quantity,
        from_warehouse_new_stock=source_adj.new_quantity,
        to_warehouse_new_stock=dest_adj.new_quantity,
        transferred_at=datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        ),
    )


@router.get("/audit-logs", response_model=List[StockAdjustmentResponse])
@router.get("/adjustments", response_model=List[StockAdjustmentResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    item_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(StockAdjustment)
        .join(Item, StockAdjustment.item_id == Item.id)
        .join(Warehouse, StockAdjustment.warehouse_id == Warehouse.id)
    )
    if item_id:
        query = query.filter(
            (StockAdjustment.item_id == item_id) | (Item.sku == item_id)
        )
    if warehouse_id:
        query = query.filter(
            (StockAdjustment.warehouse_id == warehouse_id)
            | (Warehouse.code == warehouse_id)
        )

    logs = (
        query.order_by(StockAdjustment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for l in logs:
        res = StockAdjustmentResponse(
            id=l.id,
            item_id=l.item_id,
            warehouse_id=l.warehouse_id,
            user_id=l.user_id,
            previous_quantity=l.previous_quantity,
            quantity_delta=l.quantity_delta,
            new_quantity=l.new_quantity,
            reason_code=l.reason_code,
            notes=l.notes,
            created_at=l.created_at,
            item_sku=l.item.sku if l.item else None,
            item_name=l.item.name if l.item else None,
            warehouse_name=l.warehouse.name if l.warehouse else None,
        )
        results.append(res)
    return results
