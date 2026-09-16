from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from server.database import SessionLocal
from server.models import Tenant, TenantDomain


class TenantRoutingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tenant_id_header = request.headers.get("X-Tenant-ID") or request.headers.get(
            "x-tenant-id"
        )
        host_header = request.headers.get("Host", "").split(":")[0]

        tenant = None
        db = SessionLocal()
        try:
            if tenant_id_header:
                tenant = (
                    db.query(Tenant)
                    .filter(
                        (Tenant.tenant_id == tenant_id_header)
                        | (Tenant.id == tenant_id_header)
                        | (Tenant.slug == tenant_id_header)
                    )
                    .first()
                )
                if not tenant:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Tenant is suspended or inactive"},
                    )
            elif (
                host_header
                and "." in host_header
                and not host_header.startswith("localhost")
                and not host_header.startswith("127.0.0.1")
            ):
                # Try domain match or subdomain match
                domain_match = (
                    db.query(TenantDomain)
                    .filter(TenantDomain.domain_name == host_header)
                    .first()
                )
                if domain_match:
                    tenant = (
                        db.query(Tenant)
                        .filter(Tenant.id == domain_match.tenant_id)
                        .first()
                    )
                else:
                    subdomain = host_header.split(".")[0]
                    tenant = db.query(Tenant).filter(Tenant.slug == subdomain).first()

            if tenant:
                if (
                    tenant.status in ("SUSPENDED", "CANCELLED", "SOFT_DELETED")
                    or tenant.is_deleted
                ):
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Tenant is suspended or inactive"},
                    )
                request.state.tenant_id = tenant.tenant_id
                request.state.tenant_db_id = tenant.id
                request.state.tenant = tenant
            else:
                request.state.tenant_id = None
                request.state.tenant_db_id = None
                request.state.tenant = None

        finally:
            db.close()

        response = await call_next(request)
        return response
