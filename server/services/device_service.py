import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from server.models import Device, SecurityPolicy
from server.schemas import DeviceCreate, DeviceUpdate
from server.services.audit_service import create_audit_log


def evaluate_compliance(db: Session, device: Device) -> bool:
    active_policies = (
        db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()
    )
    if not active_policies:
        return True

    is_compliant = True
    for policy in active_policies:
        if policy.require_encryption and not device.is_encrypted:
            is_compliant = False
            break
        if policy.require_passcode and not device.passcode_enforced:
            is_compliant = False
            break

        # Basic version check
        if device.os_type.lower() == "ios" and policy.min_os_version_ios:
            if device.os_version < policy.min_os_version_ios:
                is_compliant = False
                break
        elif device.os_type.lower() == "android" and policy.min_os_version_android:
            if device.os_version < policy.min_os_version_android:
                is_compliant = False
                break

    return is_compliant


def get_devices(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    ownership_type: Optional[str] = None,
    os_type: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Device]:
    query = db.query(Device)
    if status_filter:
        query = query.filter(Device.status == status_filter)
    if ownership_type:
        query = query.filter(Device.ownership_type == ownership_type)
    if os_type:
        query = query.filter(Device.os_type == os_type)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Device.serial_number.ilike(search_pattern))
            | (Device.imei.ilike(search_pattern))
            | (Device.model.ilike(search_pattern))
        )
    return query.offset(skip).limit(limit).all()


def get_device_by_id(db: Session, device_id: str) -> Optional[Device]:
    return db.query(Device).filter(Device.id == device_id).first()


def create_device(
    db: Session, device_in: DeviceCreate, actor_id: Optional[str] = None
) -> Device:
    # Check duplicate serial_number or imei
    existing_sn = (
        db.query(Device).filter(Device.serial_number == device_in.serial_number).first()
    )
    if existing_sn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device with serial number '{device_in.serial_number}' already exists.",
        )

    if device_in.imei:
        existing_imei = db.query(Device).filter(Device.imei == device_in.imei).first()
        if existing_imei:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Device with IMEI '{device_in.imei}' already exists.",
            )

    device_data = device_in.model_dump()
    device = Device(id=str(uuid.uuid4()), **device_data)
    device.is_compliant = evaluate_compliance(db, device)

    db.add(device)
    db.commit()
    db.refresh(device)

    create_audit_log(
        db=db,
        action="DEVICE_REGISTERED",
        resource_type="device",
        resource_id=device.id,
        actor_id=actor_id,
        details={"serial_number": device.serial_number, "model": device.model},
    )

    return device


def update_device(
    db: Session, device_id: str, device_in: DeviceUpdate, actor_id: Optional[str] = None
) -> Device:
    device = get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found.",
        )

    update_data = device_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)

    device.is_compliant = evaluate_compliance(db, device)

    db.commit()
    db.refresh(device)

    create_audit_log(
        db=db,
        action="DEVICE_UPDATED",
        resource_type="device",
        resource_id=device.id,
        actor_id=actor_id,
        details=update_data,
    )

    return device


def delete_device(
    db: Session, device_id: str, actor_id: Optional[str] = None
) -> Device:
    device = get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found.",
        )

    # Decommission/delete
    device.status = "Decommissioned"
    db.delete(device)
    db.commit()

    create_audit_log(
        db=db,
        action="DEVICE_DECOMMISSIONED",
        resource_type="device",
        resource_id=device_id,
        actor_id=actor_id,
        details={"serial_number": device.serial_number},
    )

    return device
