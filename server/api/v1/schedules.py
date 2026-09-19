import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from server.database import get_db
from server.models import Schedule, Channel, Program, EmergencyOverride, User
from server.schemas import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    EmergencyOverrideCreate,
    EmergencyOverrideResponse,
)
from server.auth import get_current_user, require_roles

router = APIRouter(prefix="/schedules", tags=["Schedules"])


def check_slot_conflict(
    db: Session,
    channel_id: str,
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    exclude_schedule_id: Optional[str] = None,
):
    query = db.query(Schedule).filter(
        Schedule.channel_id == channel_id,
        Schedule.status.in_(["SCHEDULED", "LIVE"]),
        Schedule.start_time < end_time,
        Schedule.end_time > start_time,
    )
    if exclude_schedule_id:
        query = query.filter(Schedule.id != exclude_schedule_id)

    conflict = query.first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time conflict with existing schedule '{conflict.id}' ({conflict.start_time} - {conflict.end_time}).",
        )


@router.get("", response_model=List[ScheduleResponse])
def list_schedules(
    channel_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[datetime.datetime] = Query(None),
    end_date: Optional[datetime.datetime] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Schedule)
    if channel_id:
        query = query.filter(Schedule.channel_id == channel_id)
    if status_filter:
        query = query.filter(Schedule.status == status_filter)
    if start_date:
        query = query.filter(Schedule.end_time >= start_date)
    if end_date:
        query = query.filter(Schedule.start_time <= end_date)

    return query.order_by(Schedule.start_time.asc()).offset(skip).limit(limit).all()


@router.get("/live", response_model=List[ScheduleResponse])
def get_live_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    live_slots = (
        db.query(Schedule)
        .filter(
            or_(
                Schedule.status == "LIVE",
                and_(
                    Schedule.status == "SCHEDULED",
                    Schedule.start_time <= now,
                    Schedule.end_time >= now,
                ),
            )
        )
        .all()
    )
    return live_slots


@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager", "Operator"])),
):
    channel = db.query(Channel).filter(Channel.id == schedule_in.channel_id).first()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )

    program = db.query(Program).filter(Program.id == schedule_in.program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Program not found"
        )

    if schedule_in.start_time >= schedule_in.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time must be before end_time",
        )

    check_slot_conflict(
        db, schedule_in.channel_id, schedule_in.start_time, schedule_in.end_time
    )

    schedule = Schedule(**schedule_in.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: str,
    schedule_in: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager", "Operator"])),
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    update_data = schedule_in.model_dump(exclude_unset=True)
    new_channel_id = update_data.get("channel_id", schedule.channel_id)
    new_start_time = update_data.get("start_time", schedule.start_time)
    new_end_time = update_data.get("end_time", schedule.end_time)

    if new_start_time >= new_end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time must be before end_time",
        )

    check_slot_conflict(
        db,
        new_channel_id,
        new_start_time,
        new_end_time,
        exclude_schedule_id=schedule.id,
    )

    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager", "Operator"])),
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    schedule.status = "CANCELLED"
    db.commit()
    return None


@router.post("/{schedule_id}/override", response_model=EmergencyOverrideResponse)
def trigger_emergency_override(
    schedule_id: str,
    override_in: EmergencyOverrideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager", "Operator"])),
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    schedule.status = "INTERRUPTED"
    schedule.is_emergency_override = True

    channel = db.query(Channel).filter(Channel.id == schedule.channel_id).first()
    if channel:
        channel.status = "EMERGENCY_OVERRIDE"

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    override = EmergencyOverride(
        channel_id=schedule.channel_id,
        triggered_by_id=current_user.id,
        interrupted_schedule_id=schedule.id,
        title=override_in.title,
        description=override_in.description,
        started_at=now,
        is_active=True,
    )
    db.add(override)
    db.commit()
    db.refresh(override)
    return override
