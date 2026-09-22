"""Cloud Provider Credentials Management Router."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import CloudProvider, AuditLog, User
from server.schemas import CloudProviderCreate, CloudProviderOut
from server.security import get_current_user, require_role
from server.services.encryption import encrypt_credentials

router = APIRouter(prefix="/providers", tags=["Cloud Providers"])


@router.get("", response_model=List[CloudProviderOut])
def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all registered cloud provider accounts (without exposing raw secrets)."""
    providers = db.query(CloudProvider).all()
    return providers


@router.post("", response_model=CloudProviderOut, status_code=status.HTTP_201_CREATED)
def create_provider(
    request: Request,
    provider_in: CloudProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Register a new cloud provider account (Admin only)."""
    provider_type = provider_in.provider_type.upper()
    if provider_type not in ["AWS", "GCP", "AZURE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid provider_type. Must be AWS, GCP, or AZURE.",
        )

    encrypted_cred = encrypt_credentials(provider_in.credentials or {})

    provider = CloudProvider(
        name=provider_in.name,
        provider_type=provider_type,
        encrypted_credentials=encrypted_cred,
        is_active=True,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREDENTIAL_CREATE",
        target_resource=f"PROVIDER:{provider.id}",
        status="SUCCESS",
        details=f"Provider {provider.name} ({provider.provider_type}) registered",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    return provider
