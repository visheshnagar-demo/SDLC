from sqlalchemy import func
from sqlalchemy.orm import Session
from server.models import Device


def get_dashboard_metrics(db: Session) -> dict:
    total_devices = db.query(Device).count()
    active_assignments = db.query(Device).filter(Device.status == "Assigned").count()
    available_devices = db.query(Device).filter(Device.status == "Available").count()
    non_compliant_count = db.query(Device).filter(Device.is_compliant == False).count()

    os_rows = (
        db.query(Device.os_type, func.count(Device.id)).group_by(Device.os_type).all()
    )
    os_distribution = {os_type or "Unknown": count for os_type, count in os_rows}

    return {
        "total_devices": total_devices,
        "active_assignments": active_assignments,
        "available_devices": available_devices,
        "non_compliant_count": non_compliant_count,
        "os_distribution": os_distribution,
    }
