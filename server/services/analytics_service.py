from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from server.models import Device


def get_dashboard_analytics(db: Session) -> Dict[str, Any]:
    total_devices = db.query(Device).filter(Device.status != "DECOMMISSIONED").count()
    active_assignments = db.query(Device).filter(Device.status == "ASSIGNED").count()
    available_devices = db.query(Device).filter(Device.status == "AVAILABLE").count()
    non_compliant_count = (
        db.query(Device)
        .filter(Device.is_compliant == False, Device.status != "DECOMMISSIONED")
        .count()
    )

    os_rows = (
        db.query(Device.os_type, func.count(Device.id))
        .filter(Device.status != "DECOMMISSIONED")
        .group_by(Device.os_type)
        .all()
    )
    os_distribution = {os_type or "Unknown": count for os_type, count in os_rows}

    status_rows = (
        db.query(Device.status, func.count(Device.id)).group_by(Device.status).all()
    )
    status_distribution = {
        status_val or "Unknown": count for status_val, count in status_rows
    }

    return {
        "total_devices": total_devices,
        "active_assignments": active_assignments,
        "available_devices": available_devices,
        "non_compliant_count": non_compliant_count,
        "os_distribution": os_distribution,
        "status_distribution": status_distribution,
    }
