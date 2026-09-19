from sqlalchemy.orm import Session
from sqlalchemy import func
from server.models import Device, DeviceAssignment
from server.schemas import DashboardMetrics


def get_dashboard_metrics(db: Session) -> DashboardMetrics:
    total_devices = db.query(func.count(Device.id)).scalar() or 0
    active_assignments = (
        db.query(func.count(DeviceAssignment.id))
        .filter(DeviceAssignment.returned_at == None)
        .scalar()
        or 0
    )

    available_devices = (
        db.query(func.count(Device.id)).filter(Device.status == "Available").scalar()
        or 0
    )

    unassigned_inventory = available_devices

    non_compliant_count = (
        db.query(func.count(Device.id)).filter(Device.is_compliant == False).scalar()
        or 0
    )

    # OS Distribution
    os_rows = (
        db.query(Device.os_type, func.count(Device.id)).group_by(Device.os_type).all()
    )
    os_distribution = {os_type: count for os_type, count in os_rows if os_type}

    # Status Distribution
    status_rows = (
        db.query(Device.status, func.count(Device.id)).group_by(Device.status).all()
    )
    status_distribution = {
        status_name: count for status_name, count in status_rows if status_name
    }

    # Ownership Distribution
    ownership_rows = (
        db.query(Device.ownership_type, func.count(Device.id))
        .group_by(Device.ownership_type)
        .all()
    )
    ownership_distribution = {
        ownership: count for ownership, count in ownership_rows if ownership
    }

    return DashboardMetrics(
        total_devices=total_devices,
        active_assignments=active_assignments,
        available_devices=available_devices,
        unassigned_inventory=unassigned_inventory,
        non_compliant_count=non_compliant_count,
        os_distribution=os_distribution,
        status_distribution=status_distribution,
        ownership_distribution=ownership_distribution,
    )
