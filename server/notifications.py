import logging
from server.models.item import Item
from server.models.warehouse import Warehouse

logger = logging.getLogger("inventory.notifications")


def send_low_stock_notification(item: Item, warehouse: Warehouse, current_stock: int):
    """
    Automated low stock notification trigger.
    Dispatches automated alert notification when stock levels fall below specified reorder thresholds.
    """
    deficit = max(0, item.reorder_threshold - current_stock)
    message = (
        f"AUTOMATED LOW STOCK ALERT: Item '{item.name}' (SKU: {item.sku}) in warehouse '{warehouse.name}' "
        f"has fallen to {current_stock} units (Reorder threshold: {item.reorder_threshold}, Deficit: {deficit}). "
        f"Suggested reorder quantity: {item.reorder_quantity}."
    )
    logger.warning(message)
    # Return structured notification dict for API / background event dispatch
    return {
        "event": "LOW_STOCK_ALERT",
        "item_id": item.id,
        "sku": item.sku,
        "warehouse_id": warehouse.id,
        "current_stock": current_stock,
        "reorder_threshold": item.reorder_threshold,
        "message": message,
    }
