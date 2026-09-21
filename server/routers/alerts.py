from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models.item import Item
from server.models.warehouse import Warehouse
from server.models.inventory import InventoryStock
from server.schemas.alert import LowStockAlert

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("", response_model=List[LowStockAlert])
def get_low_stock_alerts(
    warehouse_id: Optional[str] = None, db: Session = Depends(get_db)
):
    query = (
        db.query(InventoryStock, Item, Warehouse)
        .join(Item, InventoryStock.item_id == Item.id)
        .join(Warehouse, InventoryStock.warehouse_id == Warehouse.id)
        .filter(InventoryStock.quantity_on_hand <= Item.reorder_threshold)
    )

    if warehouse_id:
        query = query.filter(
            or_(
                InventoryStock.warehouse_id == warehouse_id,
                Warehouse.code == warehouse_id,
            )
        )

    alerts = []
    for stock, item, wh in query.all():
        deficit = max(0, item.reorder_threshold - stock.quantity_on_hand)
        status = "CRITICAL" if stock.quantity_on_hand == 0 else "LOW_STOCK"
        alert = LowStockAlert(
            item_id=item.id,
            sku=item.sku,
            item_name=item.name,
            warehouse_id=wh.id,
            warehouse_name=wh.name,
            current_stock=stock.quantity_on_hand,
            reorder_threshold=item.reorder_threshold,
            deficit=deficit,
            suggested_reorder_quantity=item.reorder_quantity,
            status=status,
        )
        alerts.append(alert)

    # Also check items with no inventory stock records at all (stock = 0)
    all_items = db.query(Item).all()
    for item in all_items:
        stocks = (
            db.query(InventoryStock).filter(InventoryStock.item_id == item.id).all()
        )
        if not stocks:
            alert = LowStockAlert(
                item_id=item.id,
                sku=item.sku,
                item_name=item.name,
                warehouse_id=None,
                warehouse_name="All Warehouses",
                current_stock=0,
                reorder_threshold=item.reorder_threshold,
                deficit=item.reorder_threshold,
                suggested_reorder_quantity=item.reorder_quantity,
                status="CRITICAL",
            )
            alerts.append(alert)

    return alerts
