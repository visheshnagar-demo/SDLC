import os
import re
import email
from email.header import decode_header
from typing import Tuple, Optional
from fastapi import HTTPException, status

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".eml", ".msg", ".txt"}


def validate_file_size_and_extension(filename: str, file_size: int):
    """Validate file size and extension according to business rules."""
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit of 10MB. Received {file_size} bytes.",
        )

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: .eml, .msg, .txt",
        )


def _decode_header_value(header_value: Optional[str]) -> str:
    if not header_value:
        return ""
    decoded_parts = []
    for part, encoding in decode_header(header_value):
        if isinstance(part, bytes):
            try:
                decoded_parts.append(part.decode(encoding or "utf-8", errors="replace"))
            except Exception:
                decoded_parts.append(part.decode("latin-1", errors="replace"))
        else:
            decoded_parts.append(str(part))
    return " ".join(decoded_parts).strip()


def _strip_html_tags(html_content: str) -> str:
    text = re.sub(r"<style[\s\S]*?</style>", "", html_content, flags=re.IGNORECASE)
    text = re.sub(r"<script[\s\S]*?</script>", "", html_content, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_eml(file_bytes: bytes) -> Tuple[Optional[str], str]:
    """Parse an RFC 822 / MIME .eml file."""
    msg = email.message_from_bytes(file_bytes)
    subject = _decode_header_value(msg.get("Subject")) or None

    body_parts = []
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in content_disposition:
                continue

            payload = part.get_payload(decode=True)
            if not payload:
                continue

            charset = part.get_content_charset() or "utf-8"
            try:
                decoded_text = payload.decode(charset, errors="replace")
            except Exception:
                decoded_text = payload.decode("latin-1", errors="replace")

            if content_type == "text/plain":
                body_parts.append(decoded_text)
            elif content_type == "text/html" and not body_parts:
                body_parts.append(_strip_html_tags(decoded_text))
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            try:
                decoded_text = payload.decode(charset, errors="replace")
            except Exception:
                decoded_text = payload.decode("latin-1", errors="replace")
            if msg.get_content_type() == "text/html":
                body_parts.append(_strip_html_tags(decoded_text))
            else:
                body_parts.append(decoded_text)

    body = "\n".join(body_parts).strip()
    if not body and not subject:
        # Fallback to raw string decode
        body = file_bytes.decode("utf-8", errors="replace").strip()

    return subject, body


def parse_msg(file_bytes: bytes) -> Tuple[Optional[str], str]:
    """Parse an Outlook .msg binary file or text fallback."""
    subject = None
    body = ""

    # Try standard string extraction / compound binary extraction
    # Look for subject and body streams in binary data
    try:
        # Check UTF-16 and ASCII text chunks
        text_content_utf16 = file_bytes.decode("utf-16-le", errors="ignore")
        text_content_utf8 = file_bytes.decode("utf-8", errors="ignore")

        # Check for Subject pattern
        subj_match = re.search(
            r"Subject:\s*([^\r\n]+)", text_content_utf8, re.IGNORECASE
        ) or re.search(r"Subject:\s*([^\r\n]+)", text_content_utf16, re.IGNORECASE)
        if subj_match:
            subject = subj_match.group(1).strip()

        # Clean printable text from utf-8/utf-16
        printable_lines = []
        for line in text_content_utf8.splitlines():
            cleaned = "".join(
                c for c in line if c.isprintable() or c in "\t\n\r"
            ).strip()
            if len(cleaned) > 10 and not cleaned.startswith("\x00"):
                printable_lines.append(cleaned)

        if printable_lines:
            body = "\n".join(printable_lines[:50])
        else:
            body = file_bytes.decode("latin-1", errors="replace").strip()
    except Exception:
        body = file_bytes.decode("latin-1", errors="replace").strip()

    return subject, body


def parse_txt(file_bytes: bytes) -> Tuple[Optional[str], str]:
    """Parse a plain text (.txt) email file."""
    try:
        text = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text = file_bytes.decode("latin-1", errors="replace")

    lines = text.splitlines()
    subject = None
    body_lines = []

    for i, line in enumerate(lines):
        if line.lower().startswith("subject:") and subject is None:
            subject = line.split(":", 1)[1].strip()
        else:
            body_lines.append(line)

    body = "\n".join(body_lines).strip()
    if not body and text.strip():
        body = text.strip()

    return subject, body


def generate_preview(body: str, max_length: int = 250) -> str:
    """Generate a clean single-line or concise preview snippet from body text."""
    if not body:
        return ""
    cleaned = re.sub(r"\s+", " ", body).strip()
    if len(cleaned) <= max_length:
        return cleaned
    return cleaned[:max_length].rstrip() + "..."
