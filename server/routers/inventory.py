import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models.item import Item
from server.models.warehouse import Warehouse
from server.models.inventory import InventoryStock
from server.models.audit_log import StockAdjustment
from server.schemas.inventory import InventoryStockResponse, StockAdjustmentCreate
from server.schemas.audit_log import StockAdjustmentResponse
from server.notifications import send_low_stock_notification

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


def process_adjustment(
    db: Session, item_id: str, adj_in: StockAdjustmentCreate
) -> StockAdjustment:
    # Resolve item
    item = db.query(Item).filter(or_(Item.id == item_id, Item.sku == item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found.")

    # Resolve warehouse
    warehouse = (
        db.query(Warehouse)
        .filter(
            or_(
                Warehouse.id == adj_in.warehouse_id,
                Warehouse.code == adj_in.warehouse_id,
            )
        )
        .first()
    )
    if not warehouse:
        raise HTTPException(
            status_code=404, detail=f"Warehouse '{adj_in.warehouse_id}' not found."
        )

    # Get or create inventory stock record
    stock = (
        db.query(InventoryStock)
        .filter(
            InventoryStock.item_id == item.id,
            InventoryStock.warehouse_id == warehouse.id,
        )
        .first()
    )

    if not stock:
        stock = InventoryStock(
            id=str(uuid.uuid4()),
            item_id=item.id,
            warehouse_id=warehouse.id,
            quantity_on_hand=0,
        )
        db.add(stock)
        db.flush()

    previous_qty = stock.quantity_on_hand

    # Determine quantity delta
    if adj_in.quantity_delta is not None:
        delta = adj_in.quantity_delta
    elif adj_in.quantity is not None:
        adj_type = (adj_in.adjustment_type or "add").lower()
        if adj_type == "add":
            delta = adj_in.quantity
        elif adj_type == "remove":
            delta = -abs(adj_in.quantity)
        elif adj_type == "set":
            delta = adj_in.quantity - previous_qty
        else:
            delta = adj_in.quantity
    else:
        raise HTTPException(
            status_code=400, detail="Must specify 'quantity_delta' or 'quantity'."
        )

    new_qty = previous_qty + delta
    if new_qty < 0:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient stock. Operation results in negative stock ({new_qty}).",
        )

    stock.quantity_on_hand = new_qty

    # Trigger automated notification if stock falls below or equal to reorder threshold
    if new_qty <= item.reorder_threshold:
        send_low_stock_notification(item, warehouse, new_qty)

    # Create audit log
    audit_entry = StockAdjustment(
        id=str(uuid.uuid4()),
        item_id=item.id,
        warehouse_id=warehouse.id,
        user_id=adj_in.user_id,
        previous_quantity=previous_qty,
        quantity_delta=delta,
        new_quantity=new_qty,
        reason_code=adj_in.reason_code,
        notes=adj_in.notes,
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry


@router.get("", response_model=List[InventoryStockResponse])
def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[str] = None,
    is_low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(InventoryStock, Item, Warehouse)
        .join(Item, InventoryStock.item_id == Item.id)
        .join(Warehouse, InventoryStock.warehouse_id == Warehouse.id)
    )

    if warehouse_id:
        query = query.filter(
            or_(
                InventoryStock.warehouse_id == warehouse_id,
                Warehouse.code == warehouse_id,
            )
        )

    if is_low_stock is True:
        query = query.filter(InventoryStock.quantity_on_hand <= Item.reorder_threshold)

    results = query.offset(skip).limit(limit).all()

    response = []
    for stock, item, warehouse in results:
        res = InventoryStockResponse(
            id=stock.id,
            item_id=stock.item_id,
            warehouse_id=stock.warehouse_id,
            quantity_on_hand=stock.quantity_on_hand,
            updated_at=stock.updated_at,
            sku=item.sku,
            item_name=item.name,
            warehouse_name=warehouse.name,
            category=item.category,
            unit_price=item.unit_price,
            reorder_threshold=item.reorder_threshold,
        )
        response.append(res)
    return response


@router.get("/low-stock", response_model=List[InventoryStockResponse])
def list_low_stock_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return list_inventory(skip=skip, limit=limit, is_low_stock=True, db=db)


@router.post(
    "/adjust",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def adjust_inventory_body(adj_in: StockAdjustmentCreate, db: Session = Depends(get_db)):
    if not adj_in.item_id:
        raise HTTPException(
            status_code=400, detail="'item_id' field is required in request body."
        )
    adjustment = process_adjustment(db, adj_in.item_id, adj_in)

    # Enrich with item & warehouse names
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


@router.post(
    "/{item_id}/adjust",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def adjust_inventory_path(
    item_id: str, adj_in: StockAdjustmentCreate, db: Session = Depends(get_db)
):
    adjustment = process_adjustment(db, item_id, adj_in)

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


@router.get("/audit-logs", response_model=List[StockAdjustmentResponse])
def get_audit_logs(
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


@router.get("/adjustments", response_model=List[StockAdjustmentResponse])
def get_adjustments_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    item_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return get_audit_logs(
        skip=skip, limit=limit, item_id=item_id, warehouse_id=warehouse_id, db=db
    )
