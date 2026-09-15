import json
import uuid
import datetime
from typing import Any
from sqlalchemy.orm import Session
from server.models import AuditLog


SENSITIVE_KEYS = {
    "card_number",
    "pan",
    "cvv",
    "cvc",
    "password",
    "client_secret",
    "payment_token",
}


def mask_value(key: str, val: Any) -> Any:
    if not isinstance(val, str):
        return val
    lower_k = key.lower()
    if any(s in lower_k for s in SENSITIVE_KEYS):
        if len(val) <= 4:
            return "***"
        return f"****-****-****-{val[-4:]}"
    return val


def mask_payload(data: Any) -> Any:
    if isinstance(data, dict):
        masked = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                masked[k] = mask_payload(v)
            else:
                masked[k] = mask_value(k, v)
        return masked
    elif isinstance(data, list):
        return [mask_payload(item) for item in data]
    return data


def create_audit_log(
    db: Session,
    event_type: str,
    transaction_id: str | None = None,
    ip_address: str = "127.0.0.1",
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    masked = mask_payload(payload or {})
    masked_json = json.dumps(masked)

    log_entry = AuditLog(
        id=f"log_{uuid.uuid4().hex[:12]}",
        transaction_id=transaction_id,
        event_type=event_type,
        ip_address=ip_address,
        masked_payload=masked_json,
        created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
