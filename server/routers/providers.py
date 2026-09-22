"""Cloud Provider management router."""

from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from server.auth import get_current_user, require_admin
from server.database import get_db
from server.models import AuditLog, CloudProvider, User
from server.schemas import CloudProviderCreate, CloudProviderResponse

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("", response_model=List[CloudProviderResponse])
def list_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all registered cloud provider accounts (Available for all authenticated users)."""
    providers = (
        db.query(CloudProvider)
        .order_by(CloudProvider.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return providers


@router.post(
    "", response_model=CloudProviderResponse, status_code=status.HTTP_201_CREATED
)
def create_provider(
    provider_in: CloudProviderCreate,
    req: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Register a new cloud provider account (Admin only)."""
    client_ip = req.client.host if req.client else "127.0.0.1"
    provider = CloudProvider(
        id=str(uuid.uuid4()),
        name=provider_in.name,
        provider_type=provider_in.provider_type.upper(),
        account_id=provider_in.account_id,
        region=provider_in.region,
        credentials_encrypted=provider_in.credentials_encrypted,
        is_active=True,
    )
    db.add(provider)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        user_email=current_user.email,
        action="CLOUD_PROVIDER_REGISTERED",
        target_resource=f"PROVIDER:{provider.id}",
        status="SUCCESS",
        ip_address=client_ip,
        details=f"Registered provider {provider.name} ({provider.provider_type})",
    )
    db.add(audit)

    try:
        db.commit()
        db.refresh(provider)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register cloud provider: {str(exc)}",
        )

    return provider


@router.get("/{provider_id}", response_model=CloudProviderResponse)
def get_provider(
    provider_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve details for a specific cloud provider."""
    provider = db.query(CloudProvider).filter(CloudProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with id '{provider_id}' not found",
        )
    return provider
