"""Encryption service for cloud provider credentials using AES-256-GCM."""

import os
import base64
import json
import hashlib
from typing import Dict, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from server.config import settings


def _get_key() -> bytes:
    # Derive a 256-bit (32 byte) key from ENCRYPTION_MASTER_KEY
    key_material = settings.ENCRYPTION_MASTER_KEY.encode("utf-8")
    return hashlib.sha256(key_material).digest()


def encrypt_credentials(data: Dict[str, Any]) -> str:
    """Encrypt a dictionary of credentials into a base64 string."""
    json_bytes = json.dumps(data).encode("utf-8")
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # Standard 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, json_bytes, None)
    # Combine nonce + ciphertext
    payload = nonce + ciphertext
    return base64.b64encode(payload).decode("utf-8")


def decrypt_credentials(encrypted_data_str: str) -> Dict[str, Any]:
    """Decrypt a base64 encrypted payload back into a dictionary."""
    try:
        payload = base64.b64decode(encrypted_data_str.encode("utf-8"))
        if len(payload) < 12:
            return json.loads(encrypted_data_str)
        nonce = payload[:12]
        ciphertext = payload[12:]
        key = _get_key()
        aesgcm = AESGCM(key)
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return json.loads(decrypted_bytes.decode("utf-8"))
    except Exception:
        # Fallback in case raw json was stored
        try:
            return json.loads(encrypted_data_str)
        except Exception:
            return {}
