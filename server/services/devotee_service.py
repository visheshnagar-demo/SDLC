import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db, get_password_hash
from server import models, schemas

router = APIRouter(prefix="/api/v1/devotees", tags=["Devotees"])


@router.post(
    "", response_model=schemas.DevoteeResponse, status_code=status.HTTP_201_CREATED
)
def create_devotee(devotee_in: schemas.DevoteeCreate, db: Session = Depends(get_db)):
    user_id = None
    email_str = devotee_in.email
    if email_str:
        user = db.query(models.User).filter(models.User.email == email_str).first()
        if not user:
            user = models.User(
                id=str(uuid.uuid4()),
                email=email_str,
                full_name=devotee_in.full_name,
                hashed_password=get_password_hash("defaultpass123"),
                role="devotee",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        user_id = user.id

    devotee_count = db.query(models.Devotee).count()
    devotee_number = f"DEV-2026-{(devotee_count + 1):05d}"

    devotee = models.Devotee(
        id=str(uuid.uuid4()),
        user_id=user_id,
        devotee_number=devotee_number,
        phone=devotee_in.phone,
        address=devotee_in.address,
    )
    db.add(devotee)
    db.commit()
    db.refresh(devotee)

    res = schemas.DevoteeResponse.from_orm(devotee)
    if devotee.user:
        res.full_name = devotee.user.full_name
        res.email = devotee.user.email
    else:
        res.full_name = devotee_in.full_name
        res.email = devotee_in.email
    return res


@router.get("", response_model=List[schemas.DevoteeResponse])
def list_devotees(
    phone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(models.Devotee)
    if phone:
        query = query.filter(models.Devotee.phone.contains(phone))
    if email:
        query = query.join(models.User).filter(models.User.email.contains(email))

    devotees = query.offset(skip).limit(limit).all()
    results = []
    for d in devotees:
        res = schemas.DevoteeResponse.from_orm(d)
        if d.user:
            res.full_name = d.user.full_name
            res.email = d.user.email
        results.append(res)
    return results


@router.get("/{devotee_id}", response_model=schemas.DevoteeResponse)
def get_devotee(devotee_id: str, db: Session = Depends(get_db)):
    devotee = db.query(models.Devotee).filter(models.Devotee.id == devotee_id).first()
    if not devotee:
        # Check by devotee_number
        devotee = (
            db.query(models.Devotee)
            .filter(models.Devotee.devotee_number == devotee_id)
            .first()
        )
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")

    res = schemas.DevoteeResponse.from_orm(devotee)
    if devotee.user:
        res.full_name = devotee.user.full_name
        res.email = devotee.user.email
    return res


@router.post(
    "/{devotee_id}/family",
    response_model=schemas.FamilyMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_family_member(
    devotee_id: str,
    family_in: schemas.FamilyMemberCreate,
    db: Session = Depends(get_db),
):
    devotee = db.query(models.Devotee).filter(models.Devotee.id == devotee_id).first()
    if not devotee:
        devotee = (
            db.query(models.Devotee)
            .filter(models.Devotee.devotee_number == devotee_id)
            .first()
        )
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")

    family_member = models.FamilyMember(
        id=str(uuid.uuid4()),
        devotee_id=devotee.id,
        full_name=family_in.full_name,
        relationship=family_in.relationship,
        gotra=family_in.gotra,
        rashi=family_in.rashi,
        nakshatra=family_in.nakshatra,
    )
    db.add(family_member)
    db.commit()
    db.refresh(family_member)
    return family_member
