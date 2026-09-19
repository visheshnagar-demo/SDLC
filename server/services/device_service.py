from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.models import Device, SecurityPolicy
from server.schemas import DeviceCreate, DeviceUpdate
from server.services.audit_service import log_audit


def check_version_gte(version: str, min_version: str) -> bool:
    try:
        v_parts = [int(x) for x in version.split(".") if x.isdigit()]
        m_parts = [int(x) for x in min_version.split(".") if x.isdigit()]
        for v, m in zip(v_parts, m_parts):
            if v > m:
                return True
            if v < m:
                return False
        return len(v_parts) >= len(m_parts)
    except Exception:
        return True


def evaluate_device_compliance(device: Device, db: Session) -> bool:
    active_policy = (
        db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).first()
    )
    if not active_policy:
        device.is_compliant = True
        return True

    is_compliant = True

    if active_policy.require_encryption and not device.is_encrypted:
        is_compliant = False

    if active_policy.require_passcode and not device.passcode_enforced:
        is_compliant = False

    if device.os_type.lower() == "ios" and active_policy.min_os_version_ios:
        if not check_version_gte(device.os_version, active_policy.min_os_version_ios):
            is_compliant = False
    elif device.os_type.lower() == "android" and active_policy.min_os_version_android:
        if not check_version_gte(
            device.os_version, active_policy.min_os_version_android
        ):
            is_compliant = False

    device.is_compliant = is_compliant
    return is_compliant


def create_device(
    db: Session, device_in: DeviceCreate, actor_id: Optional[str] = None
) -> Device:
    device = Device(
        serial_number=device_in.serial_number,
        imei=device_in.imei,
        model=device_in.model,
        manufacturer=device_in.manufacturer,
        os_type=device_in.os_type,
        os_version=device_in.os_version,
        ownership_type=device_in.ownership_type,
        is_encrypted=device_in.is_encrypted,
        passcode_enforced=device_in.passcode_enforced,
        status="Available",
    )
    evaluate_device_compliance(device, db)
    db.add(device)
    db.commit()
    db.refresh(device)

    log_audit(
        db=db,
        actor_id=actor_id,
        action="DEVICE_REGISTERED",
        resource_type="Device",
        resource_id=device.id,
        details={"serial_number": device.serial_number, "model": device.model},
    )
    return device


def get_device(db: Session, device_id: str) -> Optional[Device]:
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        evaluate_device_compliance(device, db)
        db.commit()
    return device


def list_devices(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    ownership_type: Optional[str] = None,
    os_type: Optional[str] = None,
    search: Optional[str] = None,
    is_compliant: Optional[bool] = None,
) -> Tuple[List[Device], int]:
    query = db.query(Device)

    if status:
        query = query.filter(Device.status == status)
    if ownership_type:
        query = query.filter(Device.ownership_type == ownership_type)
    if os_type:
        query = query.filter(Device.os_type == os_type)
    if is_compliant is not None:
        query = query.filter(Device.is_compliant == is_compliant)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Device.serial_number.ilike(search_pattern),
                Device.imei.ilike(search_pattern),
                Device.model.ilike(search_pattern),
                Device.manufacturer.ilike(search_pattern),
            )
        )

    total = query.count()
    devices = query.order_by(Device.created_at.desc()).offset(skip).limit(limit).all()

    for dev in devices:
        evaluate_device_compliance(dev, db)
    db.commit()

    return devices, total


def update_device(
    db: Session, device_id: str, device_in: DeviceUpdate, actor_id: Optional[str] = None
) -> Optional[Device]:
    device = get_device(db, device_id)
    if not device:
        return None

    update_data = device_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)

    evaluate_device_compliance(device, db)
    db.commit()
    db.refresh(device)

    log_audit(
        db=db,
        actor_id=actor_id,
        action="DEVICE_UPDATED",
        resource_type="Device",
        resource_id=device.id,
        details=update_data,
    )
    return device


def decommission_device(
    db: Session, device_id: str, actor_id: Optional[str] = None
) -> bool:
    device = get_device(db, device_id)
    if not device:
        return False

    device.status = "Decommissioned"
    db.commit()

    log_audit(
        db=db,
        actor_id=actor_id,
        action="DEVICE_DECOMMISSIONED",
        resource_type="Device",
        resource_id=device.id,
        details={"serial_number": device.serial_number},
    )
    return True
