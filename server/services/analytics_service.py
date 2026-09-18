from sqlalchemy.orm import Session
from sqlalchemy import func
from server.models import Device
from server.schemas import DashboardAnalytics


def get_dashboard_analytics(db: Session) -> DashboardAnalytics:
    total_devices = db.query(Device).count()
    active_assignments = db.query(Device).filter(Device.status == "ASSIGNED").count()
    available_devices = db.query(Device).filter(Device.status == "AVAILABLE").count()
    non_compliant_count = db.query(Device).filter(Device.is_compliant == False).count()  # noqa: E712

    os_counts = (
        db.query(Device.os_type, func.count(Device.id)).group_by(Device.os_type).all()
    )
    os_distribution = {os_type or "Unknown": count for os_type, count in os_counts}

    status_counts = (
        db.query(Device.status, func.count(Device.id)).group_by(Device.status).all()
    )
    status_distribution = {st or "Unknown": count for st, count in status_counts}

    return DashboardAnalytics(
        total_devices=total_devices,
        active_assignments=active_assignments,
        available_devices=available_devices,
        non_compliant_count=non_compliant_count,
        os_distribution=os_distribution,
        status_distribution=status_distribution,
    )
