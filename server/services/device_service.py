import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from server.models import Device, SecurityPolicy
from server.schemas import DeviceCreate, DeviceUpdate
from server.services.audit_service import create_audit_log


def check_device_compliance(device: Device, db: Session) -> bool:
    policies = db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()  # noqa: E712
    if not policies:
        return True

    is_compliant = True
    for policy in policies:
        if policy.require_encryption and not device.is_encrypted:
            is_compliant = False
            break
        if policy.require_passcode and not device.passcode_enforced:
            is_compliant = False
            break

        # Version check (simple string comparison for basic semantic versions)
        if device.os_type.lower() == "ios":
            if device.os_version < policy.min_os_version_ios:
                is_compliant = False
                break
        elif device.os_type.lower() == "android":
            if device.os_version < policy.min_os_version_android:
                is_compliant = False
                break

    return is_compliant


def create_device(
    db: Session, device_in: DeviceCreate, actor_id: Optional[str] = None
) -> Device:
    # Check uniqueness of serial number and IMEI
    existing_sn = (
        db.query(Device).filter(Device.serial_number == device_in.serial_number).first()
    )
    if existing_sn:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Device with Serial Number '{device_in.serial_number}' already exists.",
        )

    existing_imei = db.query(Device).filter(Device.imei == device_in.imei).first()
    if existing_imei:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Device with IMEI '{device_in.imei}' already exists.",
        )

    device = Device(
        id=str(uuid.uuid4()),
        serial_number=device_in.serial_number,
        imei=device_in.imei,
        model=device_in.model,
        manufacturer=device_in.manufacturer,
        os_type=device_in.os_type,
        os_version=device_in.os_version,
        ownership_type=device_in.ownership_type,
        status=device_in.status,
        is_encrypted=device_in.is_encrypted,
        passcode_enforced=device_in.passcode_enforced,
        is_compliant=device_in.is_compliant,
    )

    # Re-verify compliance against active policies
    device.is_compliant = check_device_compliance(device, db)

    db.add(device)
    db.commit()
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action="REGISTER_DEVICE",
        resource_type="DEVICE",
        resource_id=device.id,
        details={
            "serial_number": device.serial_number,
            "imei": device.imei,
            "model": device.model,
        },
    )

    return device


def get_devices(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    os_type: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Device]:
    query = db.query(Device)
    if status_filter:
        query = query.filter(Device.status == status_filter)
    if os_type:
        query = query.filter(Device.os_type.ilike(os_type))
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Device.serial_number.ilike(search_fmt),
                Device.imei.ilike(search_fmt),
                Device.model.ilike(search_fmt),
                Device.manufacturer.ilike(search_fmt),
            )
        )
    return query.order_by(Device.created_at.desc()).offset(skip).limit(limit).all()


def get_device_by_id(db: Session, device_id: str) -> Device:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found.",
        )
    return device


def update_device(
    db: Session, device_id: str, device_in: DeviceUpdate, actor_id: Optional[str] = None
) -> Device:
    device = get_device_by_id(db, device_id)

    update_data = device_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)

    # Re-eval compliance
    device.is_compliant = check_device_compliance(device, db)

    db.commit()
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action="UPDATE_DEVICE",
        resource_type="DEVICE",
        resource_id=device.id,
        details=update_data,
    )

    return device


def decommission_device(
    db: Session, device_id: str, actor_id: Optional[str] = None
) -> Device:
    device = get_device_by_id(db, device_id)
    device.status = "DECOMMISSIONED"

    db.commit()
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action="DECOMMISSION_DEVICE",
        resource_type="DEVICE",
        resource_id=device.id,
        details={"status": "DECOMMISSIONED"},
    )

    return device
