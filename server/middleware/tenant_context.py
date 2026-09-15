from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from server.database import SessionLocal
from server.models import Tenant


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tenant_id_header = request.headers.get("X-Tenant-ID") or request.headers.get(
            "x-tenant-id"
        )

        path_parts = [p for p in request.url.path.split("/") if p]
        tenant_id_path = None
        if (
            len(path_parts) >= 4
            and path_parts[0] == "api"
            and path_parts[1] == "v1"
            and path_parts[2] == "tenants"
        ):
            possible_id = path_parts[3]
            if possible_id not in ["audit-logs", "config", "users", "status"]:
                tenant_id_path = possible_id

        target_tenant_identifier = tenant_id_header or tenant_id_path

        request.state.tenant_id = None
        request.state.tenant = None

        if target_tenant_identifier:
            db = SessionLocal()
            try:
                tenant = (
                    db.query(Tenant)
                    .filter(
                        (Tenant.id == target_tenant_identifier)
                        | (Tenant.slug == target_tenant_identifier)
                    )
                    .first()
                )

                if not tenant:
                    if tenant_id_header:
                        return JSONResponse(
                            status_code=401,
                            content={
                                "detail": f"Invalid or unknown Tenant ID: {target_tenant_identifier}"
                            },
                        )
                else:
                    request.state.tenant_id = tenant.id
                    request.state.tenant = tenant

                    # Check if this request is a platform status update or tenant management call
                    is_status_update = (
                        request.method == "PATCH"
                        and len(path_parts) >= 5
                        and path_parts[0] == "api"
                        and path_parts[1] == "v1"
                        and path_parts[2] == "tenants"
                        and path_parts[4] == "status"
                    )

                    # Only block active operations if tenant is suspended/deactivated and NOT updating status
                    if (
                        tenant.status in ["Suspended", "Deactivated"]
                        and not is_status_update
                    ):
                        return JSONResponse(
                            status_code=403,
                            content={
                                "detail": f"Tenant '{tenant.name}' is currently {tenant.status.lower()}."
                            },
                        )
            finally:
                db.close()

        response = await call_next(request)
        return response
