from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Flock, EggCollection
from server.schemas import EggCollectionCreate, EggCollectionResponse

router = APIRouter(prefix="/egg-collections", tags=["Egg Collections"])


@router.post("", response_model=EggCollectionResponse, status_code=status.HTTP_201_CREATED)
def create_egg_collection(
    collection_in: EggCollectionCreate, db: Session = Depends(get_db)
):
    flock = db.query(Flock).filter(Flock.id == collection_in.flock_id).first()
    if not flock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flock not found",
        )

    total_count = (
        collection_in.grade_large
        + collection_in.grade_medium
        + collection_in.grade_small
        + collection_in.damaged
    )

    warning_msg = None
    if total_count > flock.active_count:
        warning_msg = (
            f"Collection total ({total_count}) exceeds active hen count ({flock.active_count})."
        )

    collection = EggCollection(
        flock_id=collection_in.flock_id,
        collection_date=collection_in.collection_date,
        session=collection_in.session,
        grade_large=collection_in.grade_large,
        grade_medium=collection_in.grade_medium,
        grade_small=collection_in.grade_small,
        damaged=collection_in.damaged,
        total_count=total_count,
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)

    # Return Pydantic schema with warning field populated dynamically
    resp = EggCollectionResponse.model_validate(collection)
    resp.warning = warning_msg
    return resp


@router.get("", response_model=List[EggCollectionResponse])
def list_egg_collections(
    flock_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(EggCollection)
    if flock_id:
        query = query.filter(EggCollection.flock_id == flock_id)
    if start_date:
        query = query.filter(EggCollection.collection_date >= start_date)
    if end_date:
        query = query.filter(EggCollection.collection_date <= end_date)

    collections = query.order_by(EggCollection.collection_date.desc()).offset(skip).limit(limit).all()
    return collections
