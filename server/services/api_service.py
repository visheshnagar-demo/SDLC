import json
import ipaddress
import socket
from urllib.parse import urlparse
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models.api_model import ApiEndpoint
from server.schemas.api_schema import ApiCreate, ApiUpdate
from server.config import settings


def is_private_or_loopback_ip(hostname: str) -> bool:
    try:
        ip = ipaddress.ip_address(hostname)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_unspecified
        )
    except ValueError:
        pass

    try:
        # Resolve hostname
        ip_str = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(ip_str)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_unspecified
        )
    except Exception:
        return False


def validate_url_security(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL scheme must be http or https",
        )
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL hostname",
        )

    # In production or when internal IPs are disallowed, prevent SSRF
    if not settings.ALLOW_INTERNAL_IPS and not settings.TESTING:
        if hostname.lower() in (
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "::1",
            "169.254.169.254",
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access to private or loopback addresses is not permitted (SSRF guard)",
            )
        if is_private_or_loopback_ip(hostname):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access to private or local network targets is blocked for security",
            )


class ApiService:
    @staticmethod
    def list_apis(db: Session, skip: int = 0, limit: int = 100) -> list[ApiEndpoint]:
        return db.query(ApiEndpoint).offset(skip).limit(limit).all()

    @staticmethod
    def get_api_by_id(db: Session, api_id: str) -> Optional[ApiEndpoint]:
        return db.query(ApiEndpoint).filter(ApiEndpoint.id == api_id).first()

    @staticmethod
    def create_api(db: Session, api_in: ApiCreate) -> ApiEndpoint:
        validate_url_security(api_in.target_url)

        headers_str = None
        if api_in.request_headers is not None:
            headers_str = json.dumps(api_in.request_headers)

        api = ApiEndpoint(
            name=api_in.name,
            target_url=api_in.target_url,
            http_method=api_in.http_method,
            interval_seconds=api_in.interval_seconds,
            expected_status=api_in.expected_status,
            timeout_seconds=api_in.timeout_seconds,
            request_headers=headers_str,
            request_body=api_in.request_body,
            is_active=api_in.is_active,
            current_status="Healthy",
        )
        db.add(api)
        db.commit()
        db.refresh(api)
        return api

    @staticmethod
    def update_api(
        db: Session, api_id: str, api_in: ApiUpdate
    ) -> Optional[ApiEndpoint]:
        api = db.query(ApiEndpoint).filter(ApiEndpoint.id == api_id).first()
        if not api:
            return None

        update_data = api_in.model_dump(exclude_unset=True)
        if "target_url" in update_data and update_data["target_url"]:
            validate_url_security(update_data["target_url"])

        for field, value in update_data.items():
            if field == "request_headers":
                setattr(api, field, json.dumps(value) if value is not None else None)
            else:
                setattr(api, field, value)

        db.commit()
        db.refresh(api)
        return api

    @staticmethod
    def delete_api(db: Session, api_id: str) -> bool:
        api = db.query(ApiEndpoint).filter(ApiEndpoint.id == api_id).first()
        if not api:
            return False
        db.delete(api)
        db.commit()
        return True


api_service = ApiService()
