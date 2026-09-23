import os
import email
from email import policy
from typing import Tuple, Optional


ALLOWED_EXTENSIONS = {".eml", ".msg", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB in bytes


def validate_file_metadata(filename: str, size: int) -> str:
    """Validates file extension and size. Returns normalized extension."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if size > MAX_FILE_SIZE:
        raise ValueError(
            f"File size ({size} bytes) exceeds maximum allowed limit of 10MB."
        )
    return ext


def extract_preview(body: str, max_length: int = 120) -> str:
    """Generates a clean preview snippet from email body."""
    if not body:
        return ""
    clean = " ".join(body.split())
    if len(clean) <= max_length:
        return clean
    return clean[:max_length].rstrip() + "..."


def parse_eml_bytes(content: bytes) -> Tuple[Optional[str], str]:
    """Parses .eml bytes using standard email library."""
    msg = email.message_from_bytes(content, policy=policy.default)
    subject = msg.get("Subject")
    if subject:
        subject = str(subject).strip()

    body_parts = []
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in content_disposition:
                continue
            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body_parts.append(payload.decode(charset, errors="replace"))
            elif content_type == "text/html" and not body_parts:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body_parts.append(payload.decode(charset, errors="replace"))
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            body_parts.append(payload.decode(charset, errors="replace"))
        else:
            raw = msg.get_payload()
            if isinstance(raw, str):
                body_parts.append(raw)

    body = "\n".join(body_parts).strip()
    if not body:
        # Fallback to string representation if payload extraction empty
        body = content.decode("utf-8", errors="replace").strip()

    return subject, body


def parse_txt_bytes(content: bytes) -> Tuple[Optional[str], str]:
    """Parses plain text file bytes."""
    text = content.decode("utf-8", errors="replace").strip()
    lines = text.splitlines()
    subject = None
    body = text

    if lines and lines[0].lower().startswith("subject:"):
        subject = lines[0][8:].strip()
        body = "\n".join(lines[1:]).strip()

    return subject, body


def parse_msg_bytes(content: bytes) -> Tuple[Optional[str], str]:
    """Parses .msg bytes using standard heuristics / text extraction."""
    try:
        # Check if it parses as an email structure
        subject, body = parse_eml_bytes(content)
        if body and body != content.decode("utf-8", errors="replace").strip():
            return subject, body
    except Exception:
        pass

    # Extract printable text strings if binary
    text = content.decode("utf-8", errors="replace").strip()
    lines = text.splitlines()
    subject = None
    body = text

    for i, line in enumerate(lines[:5]):
        if line.lower().startswith("subject:"):
            subject = line[8:].strip()
            body = "\n".join(lines[:i] + lines[i + 1 :]).strip()
            break

    return subject, body


def parse_email_file(content: bytes, filename: str) -> Tuple[Optional[str], str, str]:
    """Parses an uploaded email file based on its extension."""
    ext = validate_file_metadata(filename, len(content))
    if ext == ".eml":
        subject, body = parse_eml_bytes(content)
    elif ext == ".txt":
        subject, body = parse_txt_bytes(content)
    elif ext == ".msg":
        subject, body = parse_msg_bytes(content)
    else:
        raise ValueError(f"Unsupported file format '{ext}'")

    return subject, body, ext
