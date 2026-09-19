from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Channel, User
from server.schemas import ChannelCreate, ChannelUpdate, ChannelResponse
from server.auth import get_current_user, require_roles

router = APIRouter(prefix="/channels", tags=["Channels"])


@router.get("", response_model=List[ChannelResponse])
def list_channels(
    status_filter: Optional[str] = Query(None, alias="status"),
    resolution: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Channel)
    if status_filter:
        query = query.filter(Channel.status == status_filter)
    if resolution:
        query = query.filter(Channel.resolution == resolution)
    if language:
        query = query.filter(Channel.language == language)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
def create_channel(
    channel_in: ChannelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager"])),
):
    existing = (
        db.query(Channel)
        .filter((Channel.name == channel_in.name) | (Channel.code == channel_in.code))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Channel with this name or code already exists.",
        )

    channel = Channel(**channel_in.model_dump())
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


@router.get("/{channel_id}", response_model=ChannelResponse)
def get_channel(
    channel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )
    return channel


@router.put("/{channel_id}", response_model=ChannelResponse)
def update_channel(
    channel_id: str,
    channel_in: ChannelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager"])),
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )

    update_data = channel_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(channel, field, value)

    db.commit()
    db.refresh(channel)
    return channel


@router.delete("/{channel_id}", response_model=ChannelResponse)
def delete_channel(
    channel_id: str,
    force: bool = Query(False, description="Force delete active channel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager"])),
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )

    if (channel.is_live or channel.status == "ACTIVE") and not force:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an active live-broadcasting channel. Set status to OFF_AIR first or use force=true to archive.",
        )

    channel.status = "OFF_AIR"
    channel.is_live = False
    db.commit()
    db.refresh(channel)
    return channel
