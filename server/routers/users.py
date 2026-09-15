from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import TenantUserInvite, TenantUserResponse, TenantUserListResponse
from server.services import rbac_service

router = APIRouter(prefix="/api/v1/tenants", tags=["Tenant RBAC & Users"])


@router.get("/{tenant_id}/users", response_model=TenantUserListResponse)
def list_tenant_users(
    tenant_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items, total = rbac_service.list_tenant_users(db, tenant_id, skip=skip, limit=limit)
    return TenantUserListResponse(items=items, total=total, skip=skip, limit=limit)


@router.post(
    "/{tenant_id}/users",
    response_model=TenantUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_tenant_user(
    tenant_id: str,
    data: TenantUserInvite,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else None
    return rbac_service.invite_user_to_tenant(
        db, tenant_id, data, ip_address=ip_address
    )


@router.delete("/{tenant_id}/users/{user_id}", status_code=status.HTTP_200_OK)
def revoke_tenant_user(
    tenant_id: str, user_id: str, request: Request, db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    rbac_service.revoke_user_from_tenant(db, tenant_id, user_id, ip_address=ip_address)
    return {"message": "User membership revoked successfully."}
