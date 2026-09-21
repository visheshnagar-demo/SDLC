import ipaddress
import urllib.parse
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models.api_model import APIModel
from server.schemas.api_schema import APICreate, APIUpdate
from server.config import TESTING


def validate_url_and_ssrf(url_str: str) -> None:
    """Validate URL and enforce SSRF blocklist on loopback and internal ranges."""
    parsed = urllib.parse.urlparse(url_str)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL scheme. Must be http:// or https://",
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL must include a valid host name",
        )

    # In testing mode, allow local URLs for test mocking / test servers
    if TESTING:
        return

    # Check for localhost / loopback / metadata endpoints
    blocked_hosts = {"localhost", "127.0.0.1", "169.254.169.254", "0.0.0.0"}
    if hostname.lower() in blocked_hosts or hostname.endswith(".internal.invalid"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL host is restricted by SSRF protection policy",
        )

    # Check for private IP address ranges
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"IP address {hostname} is in a restricted private range",
            )
    except ValueError:
        # Not a raw IP literal (is a regular domain name)
        pass


def get_all_apis(db: Session, skip: int = 0, limit: int = 100) -> List[APIModel]:
    return (
        db.query(APIModel)
        .order_by(APIModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_api_by_id(db: Session, api_id: str) -> Optional[APIModel]:
    return db.query(APIModel).filter(APIModel.id == api_id).first()


def create_api_record(db: Session, api_in: APICreate) -> APIModel:
    validate_url_and_ssrf(api_in.target_url)

    api_obj = APIModel(
        name=api_in.name,
        target_url=api_in.target_url,
        http_method=api_in.http_method,
        interval_seconds=api_in.interval_seconds,
        expected_status=api_in.expected_status,
        timeout_seconds=api_in.timeout_seconds,
        request_headers=api_in.request_headers,
        request_body=api_in.request_body,
        is_active=api_in.is_active,
        current_status="Healthy",
    )
    db.add(api_obj)
    db.commit()
    db.refresh(api_obj)
    return api_obj


def update_api_record(
    db: Session, api_id: str, api_in: APIUpdate
) -> Optional[APIModel]:
    api_obj = get_api_by_id(db, api_id)
    if not api_obj:
        return None

    update_data = api_in.model_dump(exclude_unset=True)
    if "target_url" in update_data and update_data["target_url"]:
        validate_url_and_ssrf(update_data["target_url"])

    for field, value in update_data.items():
        setattr(api_obj, field, value)

    db.commit()
    db.refresh(api_obj)
    return api_obj


def delete_api_record(db: Session, api_id: str) -> bool:
    api_obj = get_api_by_id(db, api_id)
    if not api_obj:
        return False

    db.delete(api_obj)
    db.commit()
    return True
