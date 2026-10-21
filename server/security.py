"""Security utilities for password hashing, JWT authentication, and HMAC QR signatures."""
import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
import bcrypt
from jose import jwt, JWTError
from server.config import settings


# --------------------- Password Hashing ---------------------
def hash_password(password: str) -> str:
    """Hash password using native bcrypt with truncation to 72 bytes."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


# --------------------- JWT Tokens ---------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# --------------------- HMAC SHA-256 QR Security ---------------------
def generate_hmac_qr_payload(
    pass_id: str,
    event_id: str,
    pass_number: str,
    tier_name: str,
    valid_from: str,
    valid_to: str,
) -> Tuple[str, str]:
    """
    Generate cryptographically signed HMAC SHA-256 QR payload string and hash.
    Format: GMSv1.<base64url_json_payload>.<signature_hex>
    """
    nonce = secrets.token_hex(8)
    payload_data = {
        "pid": pass_id,
        "eid": event_id,
        "pno": pass_number,
        "tier": tier_name,
        "valid_from": valid_from,
        "valid_to": valid_to,
        "nonce": nonce,
        "created_at": datetime.utcnow().isoformat(),
    }
    raw_json = json.dumps(payload_data, separators=(",", ":"), sort_keys=True).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw_json).decode("utf-8").rstrip("=")

    # Calculate HMAC SHA-256 signature
    secret_bytes = settings.HMAC_SECRET_KEY.encode("utf-8")
    signature = hmac.new(secret_bytes, b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()

    qr_payload_string = f"GMSv1.{b64_payload}.{signature}"
    return qr_payload_string, signature


def verify_hmac_qr_payload(qr_string: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Verify HMAC SHA-256 signature of a QR payload string.
    Returns: (is_valid, decoded_payload_dict, error_or_status_message)
    """
    if not qr_string or not isinstance(qr_string, str):
        return False, None, "INVALID_FORMAT"

    parts = qr_string.split(".")
    if len(parts) != 3 or parts[0] != "GMSv1":
        return False, None, "INVALID_PREFIX_OR_STRUCTURE"

    prefix, b64_payload, signature = parts

    # Verify signature
    secret_bytes = settings.HMAC_SECRET_KEY.encode("utf-8")
    expected_sig = hmac.new(secret_bytes, b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        return False, None, "INVALID_SIGNATURE"

    # Decode payload
    try:
        # Pad base64 string
        padded_b64 = b64_payload + "=" * (-len(b64_payload) % 4)
        raw_json = base64.urlsafe_b64decode(padded_b64.encode("utf-8")).decode("utf-8")
        payload_data = json.loads(raw_json)
        return True, payload_data, "VALID"
    except Exception as e:
        return False, None, f"DECODE_ERROR: {str(e)}"
