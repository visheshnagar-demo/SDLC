import io
import re
from email import policy
from email.parser import BytesParser, Parser
from typing import Tuple, Optional

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class FileTooLargeError(Exception):
    pass


class UnsupportedFileFormatError(Exception):
    pass


def create_preview(text: str, max_len: int = 150) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[:max_len] + "..."


def parse_email_text(
    raw_text: str, explicit_subject: Optional[str] = None
) -> Tuple[Optional[str], str]:
    raw_text = raw_text.strip()
    if not raw_text:
        return explicit_subject, ""

    # Check if raw_text contains RFC 822 / MIME email headers
    if re.search(
        r"^(From|To|Subject|Date|Received):", raw_text, re.MULTILINE | re.IGNORECASE
    ):
        try:
            msg = Parser(policy=policy.default).parsestr(raw_text)
            parsed_subject = msg.get("Subject")
            body_part = msg.get_body(preferencelist=("plain", "html"))
            body = body_part.get_content() if body_part else raw_text
            final_subject = explicit_subject or parsed_subject
            if not final_subject:
                final_subject = create_preview(body, max_len=60)
            return final_subject, str(body).strip()
        except Exception:
            pass

    # If no MIME headers detected or parsing fails
    if explicit_subject:
        return explicit_subject, raw_text

    # Check if first line resembles a subject
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    if lines and len(lines[0]) <= 80 and not lines[0].endswith("."):
        first_line = lines[0]
        if first_line.lower().startswith("subject:"):
            first_line = first_line[8:].strip()
        body = "\n".join(lines[1:]).strip() if len(lines) > 1 else raw_text
        return first_line, body or raw_text

    return create_preview(raw_text, max_len=60), raw_text


def parse_uploaded_file(
    filename: str, content: bytes
) -> Tuple[Optional[str], str, str]:
    """
    Parses an uploaded file (.eml, .msg, .txt).
    Returns (subject, body, file_type).
    file_type is the extension: '.eml', '.msg', or '.txt'.
    """
    if len(content) > MAX_FILE_SIZE:
        raise FileTooLargeError(f"File size ({len(content)} bytes) exceeds 10MB limit.")

    lower_name = filename.lower()
    ext = ""
    if "." in lower_name:
        ext = "." + lower_name.rsplit(".", 1)[-1]

    if ext == ".txt":
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="replace")
        subject, body = parse_email_text(text)
        return subject, body, ".txt"

    elif ext == ".eml":
        try:
            msg = BytesParser(policy=policy.default).parsebytes(content)
            subject = msg.get("Subject", "")
            body_part = msg.get_body(preferencelist=("plain", "html"))
            body = body_part.get_content() if body_part else ""
            if not body:
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        payload = part.get_payload(decode=True)
                        if isinstance(payload, bytes):
                            body = payload.decode(
                                part.get_content_charset() or "utf-8", errors="replace"
                            )
                        break
            if not body:
                body = content.decode("utf-8", errors="replace")
            if not subject:
                subject = create_preview(body, max_len=60)
            return subject, str(body).strip(), ".eml"
        except Exception:
            text = content.decode("utf-8", errors="replace")
            subject, body = parse_email_text(text)
            return subject, body, ".eml"

    elif ext == ".msg":
        try:
            import extract_msg

            msg_obj = extract_msg.Message(io.BytesIO(content))
            subject = msg_obj.subject or ""
            body = msg_obj.body or ""
            if not subject:
                subject = create_preview(body, max_len=60)
            return subject, str(body).strip(), ".msg"
        except Exception:
            text = content.decode("utf-8", errors="replace")
            subject, body = parse_email_text(text)
            return subject, body, ".msg"

    else:
        raise UnsupportedFileFormatError(
            f"Unsupported file format for {filename}. Only .eml, .msg, and .txt are supported."
        )
