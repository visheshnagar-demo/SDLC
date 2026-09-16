import os
from datetime import datetime
from typing import List
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.database import get_db, init_db
from server.models import WireTransfer
from server.schemas import WireCreateRequest, WireApprovalRequest, WireTransferResponse

AUTO_APPROVAL_THRESHOLD = 10000.00


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Commercial Wire Maker-Checker API",
    version="1.0.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post(
    "/api/wires",
    response_model=WireTransferResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_wire(wire_in: WireCreateRequest, db: Session = Depends(get_db)):
    wire_status = "APPROVED" if wire_in.amount <= AUTO_APPROVAL_THRESHOLD else "PENDING"

    wire = WireTransfer(
        beneficiaryName=wire_in.beneficiaryName,
        accountNumber=wire_in.accountNumber,
        routingNumber=wire_in.routingNumber,
        amount=wire_in.amount,
        status=wire_status,
        createdBy=wire_in.createdBy,
        approvedBy=wire_in.createdBy if wire_status == "APPROVED" else None,
    )
    db.add(wire)
    db.commit()
    db.refresh(wire)
    return wire


@app.get("/api/wires/pending", response_model=List[WireTransferResponse])
def get_pending_wires(db: Session = Depends(get_db)):
    pending_wires = (
        db.query(WireTransfer).filter(WireTransfer.status == "PENDING").all()
    )
    return pending_wires


@app.get("/api/wires", response_model=List[WireTransferResponse])
def get_all_wires(db: Session = Depends(get_db)):
    wires = db.query(WireTransfer).order_by(WireTransfer.createdAt.desc()).all()
    return wires


@app.put("/api/wires/{wire_id}/approve", response_model=WireTransferResponse)
def approve_wire(wire_id: str, req: WireApprovalRequest, db: Session = Depends(get_db)):
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wire transfer not found"
        )

    # Maker-Checker segregation of duties rule
    if wire.createdBy == req.approvedBy:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker cannot approve their own wire transfer (Segregation of Duties policy violation)",
        )

    wire.status = "APPROVED"
    wire.approvedBy = req.approvedBy
    wire.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(wire)
    return wire


@app.put("/api/wires/{wire_id}/reject", response_model=WireTransferResponse)
def reject_wire(wire_id: str, req: WireApprovalRequest, db: Session = Depends(get_db)):
    wire = db.query(WireTransfer).filter(WireTransfer.id == wire_id).first()
    if not wire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wire transfer not found"
        )

    # Maker-Checker segregation of duties rule
    if wire.createdBy == req.approvedBy:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker cannot reject their own wire transfer (Segregation of Duties policy violation)",
        )

    wire.status = "REJECTED"
    wire.approvedBy = req.approvedBy
    wire.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(wire)
    return wire
