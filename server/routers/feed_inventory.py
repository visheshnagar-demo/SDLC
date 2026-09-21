from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Flock, FeedInventory, FeedLog
from server.schemas import (
    FeedInventoryCreate,
    FeedInventoryResponse,
    FeedLogCreate,
    FeedLogResponse,
)

router = APIRouter(tags=["Feed Inventory & Consumption"])


@router.get("/feed-inventory", response_model=List[FeedInventoryResponse])
def list_feed_inventory(db: Session = Depends(get_db)):
    inventory = db.query(FeedInventory).all()
    return inventory


@router.post(
    "/feed-inventory",
    response_model=FeedInventoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_or_update_feed_inventory(
    item_in: FeedInventoryCreate, db: Session = Depends(get_db)
):
    existing = (
        db.query(FeedInventory)
        .filter(FeedInventory.feed_type == item_in.feed_type)
        .first()
    )
    if existing:
        existing.quantity_kg += item_in.quantity_kg
        if item_in.reorder_threshold_kg is not None:
            existing.reorder_threshold_kg = item_in.reorder_threshold_kg
        db.commit()
        db.refresh(existing)
        return existing

    feed_item = FeedInventory(
        feed_type=item_in.feed_type,
        quantity_kg=item_in.quantity_kg,
        reorder_threshold_kg=item_in.reorder_threshold_kg,
    )
    db.add(feed_item)
    db.commit()
    db.refresh(feed_item)
    return feed_item


@router.post(
    "/feed-logs",
    response_model=FeedLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def log_feed_consumption(
    log_in: FeedLogCreate, db: Session = Depends(get_db)
):
    flock = db.query(Flock).filter(Flock.id == log_in.flock_id).first()
    if not flock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flock not found",
        )

    feed_item = (
        db.query(FeedInventory).filter(FeedInventory.id == log_in.feed_id).first()
    )
    if not feed_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed inventory item not found",
        )

    if log_in.quantity_used_kg > feed_item.quantity_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient Feed Stock in Inventory. Available: {feed_item.quantity_kg} kg, Requested: {log_in.quantity_used_kg} kg.",
        )

    feed_item.quantity_kg -= log_in.quantity_used_kg
    low_stock = feed_item.quantity_kg < feed_item.reorder_threshold_kg

    feed_log = FeedLog(
        flock_id=log_in.flock_id,
        feed_id=log_in.feed_id,
        quantity_used_kg=log_in.quantity_used_kg,
        log_date=log_in.log_date,
    )
    db.add(feed_log)
    db.commit()
    db.refresh(feed_log)
    db.refresh(feed_item)

    resp = FeedLogResponse.model_validate(feed_log)
    resp.remaining_feed_stock_kg = feed_item.quantity_kg
    resp.low_stock_alert = low_stock
    return resp


@router.get("/feed-logs", response_model=List[FeedLogResponse])
def list_feed_logs(
    flock_id: Optional[str] = None,
    feed_id: Optional[str] = None,
    log_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(FeedLog)
    if flock_id:
        query = query.filter(FeedLog.flock_id == flock_id)
    if feed_id:
        query = query.filter(FeedLog.feed_id == feed_id)
    if log_date:
        query = query.filter(FeedLog.log_date == log_date)

    logs = query.order_by(FeedLog.log_date.desc()).offset(skip).limit(limit).all()
    res = []
    for log in logs:
        feed = db.query(FeedInventory).filter(FeedInventory.id == log.feed_id).first()
        r = FeedLogResponse.model_validate(log)
        if feed:
            r.remaining_feed_stock_kg = feed.quantity_kg
            r.low_stock_alert = feed.quantity_kg < feed.reorder_threshold_kg
        res.append(r)
    return res
