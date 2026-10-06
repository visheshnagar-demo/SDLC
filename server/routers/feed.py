from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import FeedRation, FeedInventory, Cattle, MilkLog
from server.schemas import (
    FeedRationCreate,
    FeedRationUpdate,
    FeedRationOut,
    FeedInventoryCreate,
    FeedInventoryUpdate,
    FeedInventoryOut,
    FeedAllocationCalculateRequest,
    FeedAllocationResultOut,
)

router = APIRouter(tags=["Feed & Ration Allocation"])


# ==========================================
# FEED RATIONS & TMR ALLOCATION CALCULATION
# ==========================================
@router.post(
    "/api/v1/feed-rations/calculate-allocation", response_model=FeedAllocationResultOut
)
def calculate_feed_allocation(
    payload: FeedAllocationCalculateRequest,
    db: Session = Depends(get_db),
):
    """Calculate dynamic Total Mixed Ration (TMR) feed allocation based on lactation stage, milk yield, and body condition score (BCS)."""
    bcs = payload.body_condition_score
    weight = payload.body_weight_kg
    yield_l = payload.daily_milk_yield_liters
    stage = payload.lactation_stage

    # If cow_id is provided, populate from database
    if payload.cow_id:
        cow = db.query(Cattle).filter(Cattle.id == payload.cow_id).first()
        if not cow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cattle with ID '{payload.cow_id}' not found",
            )
        if cow.body_condition_score is not None:
            bcs = cow.body_condition_score
        if cow.weight_kg is not None:
            weight = cow.weight_kg
        if cow.status.lower() == "dry":
            stage = "Dry"

        # Check latest milk log for yield
        latest_milk = (
            db.query(MilkLog)
            .filter(MilkLog.cow_id == cow.id)
            .order_by(MilkLog.milking_date.desc(), MilkLog.created_at.desc())
            .first()
        )
        if latest_milk:
            # Estimate daily yield (2x single session or actual)
            yield_l = latest_milk.yield_liters * 2.0

    # Base dry matter intake (DMI) formula:
    base_maintenance_dmi = weight * 0.019
    production_dmi = yield_l * 0.33

    bcs_factor = 1.0
    if bcs < 2.75:
        bcs_factor = 1.08  # Boost for skinny cow
    elif bcs > 3.75:
        bcs_factor = 0.95  # Moderation for overly fat cow

    total_dmi = (base_maintenance_dmi + production_dmi) * bcs_factor

    # Determine formulation breakdown and target group
    if stage.lower() == "dry" or yield_l < 5.0:
        target_group = "Dry Cows"
        silage_pct = 75.0
        concentrate_pct = 10.0
        supplements_pct = 15.0
        notes = f"Dry cow maintenance ration for BCS {bcs:.1f}. High fiber forage to maintain rumen volume."
    elif yield_l >= 28.0:
        target_group = "High Yield"
        silage_pct = 55.0
        concentrate_pct = 30.0
        supplements_pct = 15.0
        notes = f"High-yield lactation TMR for {yield_l:.1f}L/day yield. High energy density concentrate with bypass protein."
    elif yield_l >= 15.0:
        target_group = "Mid Yield"
        silage_pct = 65.0
        concentrate_pct = 20.0
        supplements_pct = 15.0
        notes = f"Mid-yield balanced lactation ration for {yield_l:.1f}L/day yield."
    else:
        target_group = "Heifers"
        silage_pct = 60.0
        concentrate_pct = 25.0
        supplements_pct = 15.0
        notes = "Standard growth and maintenance ration."

    silage_kg = total_dmi * (silage_pct / 100.0)
    concentrate_kg = total_dmi * (concentrate_pct / 100.0)
    supplements_kg = total_dmi * (supplements_pct / 100.0)

    return FeedAllocationResultOut(
        cow_id=payload.cow_id,
        lactation_stage=stage,
        daily_milk_yield_liters=round(yield_l, 1),
        body_condition_score=round(bcs, 2),
        body_weight_kg=round(weight, 1),
        recommended_dry_matter_kg=round(total_dmi, 2),
        silage_kg=round(silage_kg, 2),
        concentrate_kg=round(concentrate_kg, 2),
        forage_supplements_kg=round(supplements_kg, 2),
        ration_target_group=target_group,
        formulation_notes=notes,
    )


@router.get(
    "/api/v1/feed-rations/cow/{cow_id}/allocation",
    response_model=FeedAllocationResultOut,
)
def get_cow_feed_allocation(cow_id: str, db: Session = Depends(get_db)):
    """Fetch cow profile, recent yield, and calculate personalized TMR feed allocation."""
    req = FeedAllocationCalculateRequest(cow_id=cow_id)
    return calculate_feed_allocation(req, db)


@router.get("/api/v1/feed-rations", response_model=List[FeedRationOut])
def list_feed_rations(
    target_group: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve TMR nutritional formulations per production group."""
    query = db.query(FeedRation)
    if target_group:
        query = query.filter(FeedRation.target_group.ilike(f"%{target_group}%"))
    return query.order_by(FeedRation.ration_name.asc()).all()


@router.post(
    "/api/v1/feed-rations",
    response_model=FeedRationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_feed_ration(payload: FeedRationCreate, db: Session = Depends(get_db)):
    """Create a new TMR feed ration profile."""
    ration = FeedRation(
        ration_name=payload.ration_name,
        target_group=payload.target_group,
        dry_matter_kg_per_day=payload.dry_matter_kg_per_day,
        silage_pct=payload.silage_pct,
        concentrate_pct=payload.concentrate_pct,
        forage_supplements_pct=payload.forage_supplements_pct,
    )
    db.add(ration)
    db.commit()
    db.refresh(ration)
    return ration


@router.get("/api/v1/feed-rations/{ration_id}", response_model=FeedRationOut)
def get_feed_ration(ration_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific TMR feed ration."""
    ration = db.query(FeedRation).filter(FeedRation.id == ration_id).first()
    if not ration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed ration not found",
        )
    return ration


@router.put("/api/v1/feed-rations/{ration_id}", response_model=FeedRationOut)
def update_feed_ration(
    ration_id: str, payload: FeedRationUpdate, db: Session = Depends(get_db)
):
    """Update a TMR feed ration formulation."""
    ration = db.query(FeedRation).filter(FeedRation.id == ration_id).first()
    if not ration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed ration not found",
        )

    if payload.ration_name is not None:
        ration.ration_name = payload.ration_name
    if payload.target_group is not None:
        ration.target_group = payload.target_group
    if payload.dry_matter_kg_per_day is not None:
        ration.dry_matter_kg_per_day = payload.dry_matter_kg_per_day
    if payload.silage_pct is not None:
        ration.silage_pct = payload.silage_pct
    if payload.concentrate_pct is not None:
        ration.concentrate_pct = payload.concentrate_pct
    if payload.forage_supplements_pct is not None:
        ration.forage_supplements_pct = payload.forage_supplements_pct

    db.commit()
    db.refresh(ration)
    return ration


@router.delete(
    "/api/v1/feed-rations/{ration_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_feed_ration(ration_id: str, db: Session = Depends(get_db)):
    """Delete a feed ration."""
    ration = db.query(FeedRation).filter(FeedRation.id == ration_id).first()
    if not ration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed ration not found",
        )
    db.delete(ration)
    db.commit()
    return None


# ==========================================
# FEED INVENTORY
# ==========================================
@router.get("/api/v1/feed-inventory", response_model=List[FeedInventoryOut])
def list_feed_inventory(
    category: Optional[str] = Query(None),
    reorder_alert_only: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve real-time feed inventory levels and stock reorder alerts."""
    query = db.query(FeedInventory)
    if category:
        query = query.filter(FeedInventory.category.ilike(f"%{category}%"))
    if reorder_alert_only:
        query = query.filter(FeedInventory.reorder_alert == True)
    return query.order_by(FeedInventory.feed_name.asc()).all()


@router.post(
    "/api/v1/feed-inventory",
    response_model=FeedInventoryOut,
    status_code=status.HTTP_201_CREATED,
)
def create_feed_inventory(payload: FeedInventoryCreate, db: Session = Depends(get_db)):
    """Create or register a feed stock inventory item."""
    existing = (
        db.query(FeedInventory)
        .filter(FeedInventory.feed_name == payload.feed_name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Feed item '{payload.feed_name}' already exists in inventory",
        )

    threshold = payload.reorder_threshold_kg
    if threshold is None or threshold <= 0:
        threshold = payload.daily_consumption_kg * 5.0

    reorder_alert = payload.current_stock_kg <= threshold

    item = FeedInventory(
        feed_name=payload.feed_name,
        category=payload.category,
        current_stock_kg=payload.current_stock_kg,
        daily_consumption_kg=payload.daily_consumption_kg,
        reorder_threshold_kg=threshold,
        reorder_alert=reorder_alert,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/api/v1/feed-inventory/{item_id}", response_model=FeedInventoryOut)
def get_feed_inventory_item(item_id: str, db: Session = Depends(get_db)):
    """Get stock details for a specific feed item."""
    item = db.query(FeedInventory).filter(FeedInventory.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed inventory item not found",
        )
    return item


@router.put("/api/v1/feed-inventory/{item_id}", response_model=FeedInventoryOut)
def update_feed_inventory(
    item_id: str, payload: FeedInventoryUpdate, db: Session = Depends(get_db)
):
    """Update feed stock balance or consumption rate with automated threshold calculation."""
    item = db.query(FeedInventory).filter(FeedInventory.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed inventory item not found",
        )

    if payload.feed_name is not None and payload.feed_name != item.feed_name:
        existing = (
            db.query(FeedInventory)
            .filter(
                FeedInventory.feed_name == payload.feed_name,
                FeedInventory.id != item_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Feed item '{payload.feed_name}' already exists in inventory",
            )
        item.feed_name = payload.feed_name

    if payload.category is not None:
        item.category = payload.category
    if payload.current_stock_kg is not None:
        item.current_stock_kg = payload.current_stock_kg
    if payload.daily_consumption_kg is not None:
        item.daily_consumption_kg = payload.daily_consumption_kg

    if payload.reorder_threshold_kg is not None:
        item.reorder_threshold_kg = payload.reorder_threshold_kg
    else:
        # Recompute 5-day consumption threshold
        item.reorder_threshold_kg = item.daily_consumption_kg * 5.0

    item.reorder_alert = item.current_stock_kg <= item.reorder_threshold_kg
    item.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/api/v1/feed-inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_feed_inventory_item(item_id: str, db: Session = Depends(get_db)):
    """Delete a feed inventory item."""
    item = db.query(FeedInventory).filter(FeedInventory.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed inventory item not found",
        )
    db.delete(item)
    db.commit()
    return None
