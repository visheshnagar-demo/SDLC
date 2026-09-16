from typing import List, Optional
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import WireTransferCreate, WireTransferResponse
from server.services import wire_service

router = APIRouter(prefix="/api/wires", tags=["wires"])


def get_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-ID")) -> str:
    if not x_user_id:
        return "User A (Maker)"
    return x_user_id


@router.post("", response_model=WireTransferResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=WireTransferResponse, status_code=status.HTTP_201_CREATED)
def create_wire(
    wire_in: WireTransferCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return wire_service.create_wire(db=db, wire_in=wire_in, created_by=user_id)


@router.get("/pending", response_model=List[WireTransferResponse])
def get_pending_wires(db: Session = Depends(get_db)):
    return wire_service.get_pending_wires(db=db)


@router.put("/{wire_id}/approve", response_model=WireTransferResponse)
def approve_wire(
    wire_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return wire_service.approve_wire(db=db, wire_id=wire_id, approved_by=user_id)


@router.put("/{wire_id}/reject", response_model=WireTransferResponse)
def reject_wire(
    wire_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return wire_service.reject_wire(db=db, wire_id=wire_id, rejected_by=user_id)
