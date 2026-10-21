"""Gate scanning, cryptographic QR verification, and check-in audit endpoints."""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Pass, GateCheckin, User
from server.schemas import GateScanRequest, GateScanResponse
from server.security import verify_hmac_qr_payload
from server.dependencies import get_optional_user

router = APIRouter(prefix="/gates", tags=["Gate Scanner"])


@router.post("/validate", response_model=GateScanResponse)
def validate_gate_pass(
    scan_req: GateScanRequest,
    db: Session = Depends(get_db),
    security_user: Optional[User] = Depends(get_optional_user),
):
    """
    Sub-second cryptographic validation of HMAC SHA-256 digital passes at venue entry gates.
    Prevents duplicate entries and logs check-in telemetry.
    """
    is_valid_sig, payload, sig_status = verify_hmac_qr_payload(scan_req.qrPayload)

    if not is_valid_sig or not payload:
        # Invalid cryptographic signature / counterfeit pass
        return GateScanResponse(
            status="INVALID_SIGNATURE",
            message="Cryptographic signature verification failed. Potential counterfeit or tampered pass.",
        )

    pass_id = payload.get("pid")
    pass_obj = db.query(Pass).filter(Pass.id == pass_id).first()

    if not pass_obj:
        return GateScanResponse(
            status="INVALID",
            message="Pass not found in system registry.",
        )

    user_id = security_user.id if security_user else None

    # Check if pass is revoked
    if pass_obj.status == "REVOKED":
        checkin = GateCheckin(
            id=str(uuid.uuid4()),
            pass_id=pass_obj.id,
            gate_identifier=scan_req.gateIdentifier,
            scanned_by_user_id=user_id,
            scan_result="REVOKED",
            notes="Attempted entry with revoked pass",
        )
        db.add(checkin)
        db.commit()

        return GateScanResponse(
            status="REVOKED",
            message="Pass has been revoked by event administration.",
            passId=pass_obj.id,
            passNumber=pass_obj.pass_number,
            attendeeName=pass_obj.attendee_name,
        )

    # Check if pass is already fully used (duplicate entry attempt)
    if pass_obj.entry_count >= pass_obj.max_entries or pass_obj.status == "USED":
        checkin = GateCheckin(
            id=str(uuid.uuid4()),
            pass_id=pass_obj.id,
            gate_identifier=scan_req.gateIdentifier,
            scanned_by_user_id=user_id,
            scan_result="DUPLICATE_BLOCKED",
            notes=f"Duplicate entry blocked at {scan_req.gateIdentifier}",
        )
        db.add(checkin)
        db.commit()

        first_checked = pass_obj.last_scanned_at.isoformat() if pass_obj.last_scanned_at else "earlier"
        return GateScanResponse(
            status="ALREADY_USED",
            message=f"Duplicate entry attempt: Pass was already used on {first_checked}.",
            passId=pass_obj.id,
            passNumber=pass_obj.pass_number,
            attendeeName=pass_obj.attendee_name,
            tierName=pass_obj.pass_tier.tier_name if pass_obj.pass_tier else "Garba Pass",
            firstCheckedInAt=first_checked,
            entryCount=pass_obj.entry_count,
            maxEntries=pass_obj.max_entries,
        )

    # Valid entry - Record check-in
    now = datetime.utcnow()
    pass_obj.entry_count += 1
    if pass_obj.entry_count >= pass_obj.max_entries:
        pass_obj.status = "USED"
    pass_obj.last_scanned_at = now

    checkin = GateCheckin(
        id=str(uuid.uuid4()),
        pass_id=pass_obj.id,
        gate_identifier=scan_req.gateIdentifier,
        scanned_by_user_id=user_id,
        scan_result="SUCCESS",
        scan_timestamp=now,
        notes=f"Authorized entry at {scan_req.gateIdentifier}",
    )
    db.add(checkin)
    db.commit()
    db.refresh(pass_obj)

    tier_name = pass_obj.pass_tier.tier_name if pass_obj.pass_tier else "Garba Pass"

    return GateScanResponse(
        status="VALID",
        message="Entry Authorized. Welcome to GarbaFest!",
        passId=pass_obj.id,
        passNumber=pass_obj.pass_number,
        attendeeName=pass_obj.attendee_name,
        tierName=tier_name,
        checkedInAt=now.isoformat(),
        entryCount=pass_obj.entry_count,
        maxEntries=pass_obj.max_entries,
    )
