"""Admin dashboard, analytics, pass quota adjustment, and attendee roster CSV export."""
import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from server.database import get_db
from server.models import Pass, PassTier, Booking, GateCheckin, User
from server.schemas import (
    AdminAnalyticsResponse,
    GateMetric,
    PassTierResponse,
    PassTierUpdate,
)
from server.dependencies import get_current_admin, get_optional_user

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/analytics/live", response_model=AdminAnalyticsResponse)
def get_live_analytics(
    db: Session = Depends(get_db),
    admin: Optional[User] = Depends(get_optional_user),
):
    """
    Retrieve real-time event analytics, gate throughput metrics, revenue, and venue occupancy.
    """
    total_passes = db.query(Pass).count()
    successful_checkins = db.query(GateCheckin).filter(GateCheckin.scan_result == "SUCCESS").count()
    total_revenue_result = db.query(func.sum(Booking.total_amount)).filter(Booking.booking_status == "CONFIRMED").scalar()
    gross_revenue = float(total_revenue_result) if total_revenue_result is not None else 0.0

    # Gate metrics aggregation
    all_checkins = db.query(GateCheckin).all()
    gate_counts = {}
    for c in all_checkins:
        gid = c.gate_identifier or "Default Gate"
        if gid not in gate_counts:
            gate_counts[gid] = {"total": 0, "success": 0, "blocked": 0}
        gate_counts[gid]["total"] += 1
        if c.scan_result == "SUCCESS":
            gate_counts[gid]["success"] += 1
        else:
            gate_counts[gid]["blocked"] += 1

    gate_metrics = []
    if gate_counts:
        for gid, counts in gate_counts.items():
            gate_metrics.append(
                GateMetric(
                    gateIdentifier=gid,
                    totalScans=counts["total"],
                    successfulScans=counts["success"],
                    blockedScans=counts["blocked"],
                )
            )
    else:
        # Default placeholder gates for UI readiness
        gate_metrics = [
            GateMetric(gateIdentifier="GATE-01-NORTH", totalScans=0, successfulScans=0, blockedScans=0),
            GateMetric(gateIdentifier="GATE-02-SOUTH", totalScans=0, successfulScans=0, blockedScans=0),
            GateMetric(gateIdentifier="GATE-03-VIP", totalScans=0, successfulScans=0, blockedScans=0),
        ]

    # Calculate simulated/recent scans per minute
    scans_per_minute = round(float(successful_checkins) * 1.5, 2) if successful_checkins > 0 else 0.0

    return AdminAnalyticsResponse(
        totalPassesIssued=total_passes,
        totalCheckedIn=successful_checkins,
        scansPerMinute=scans_per_minute,
        liveOccupancy=successful_checkins,
        grossRevenue=gross_revenue,
        gateMetrics=gate_metrics,
    )


@router.put("/pass-tiers/{id}", response_model=PassTierResponse)
def update_pass_tier(
    id: str,
    tier_update: PassTierUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Update pass tier capacity quotas, dynamic pricing, and details (Admin Only).
    """
    tier = db.query(PassTier).filter(PassTier.id == id).first()
    if not tier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pass tier with id '{id}' not found.",
        )

    if tier_update.price is not None:
        tier.price = tier_update.price
    if tier_update.total_quota is not None:
        quota_diff = tier_update.total_quota - tier.total_quota
        tier.total_quota = tier_update.total_quota
        tier.available_quota = max(0, tier.available_quota + quota_diff)
    if tier_update.available_quota is not None:
        tier.available_quota = tier_update.available_quota
    if tier_update.tier_name is not None:
        tier.tier_name = tier_update.tier_name
    if tier_update.description is not None:
        tier.description = tier_update.description

    db.commit()
    db.refresh(tier)
    return tier


@router.get("/attendees/export")
def export_attendees_csv(
    db: Session = Depends(get_db),
    admin: Optional[User] = Depends(get_optional_user),
):
    """
    Export all registered attendees and pass check-in statuses as a downloadable CSV roster.
    """
    passes = db.query(Pass).join(Booking).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Pass ID",
        "Pass Number",
        "Booking Reference",
        "Attendee Name",
        "Attendee Email",
        "Attendee Phone",
        "Pass Tier",
        "Status",
        "Entry Count",
        "Max Entries",
        "Last Scanned At",
        "Created At",
    ])

    for p in passes:
        tier_name = p.pass_tier.tier_name if p.pass_tier else "Standard"
        booking_ref = p.booking.booking_reference if p.booking else "N/A"
        last_scan = p.last_scanned_at.isoformat() if p.last_scanned_at else "Never"
        writer.writerow([
            p.id,
            p.pass_number,
            booking_ref,
            p.attendee_name,
            p.attendee_email or "",
            p.attendee_phone or "",
            tier_name,
            p.status,
            p.entry_count,
            p.max_entries,
            last_scan,
            p.created_at.isoformat(),
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="garba_attendees_export.csv"'},
    )
