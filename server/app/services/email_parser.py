import email
import io
import re
from email import policy

from pypdf import PdfReader

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".eml", ".txt", ".pdf"}


def parse_text_input(
    text: str,
    subject: str | None = None,
    sender: str | None = None,
) -> tuple[str | None, str | None, str]:
    """
    Parses direct text input and attempts heuristic header extraction if subject/sender are not provided.
    Returns: (sender, subject, body_text)
    """
    if not text or not text.strip():
        raise ValueError("Email text content cannot be empty.")

    extracted_sender = sender
    extracted_subject = subject
    lines = text.strip().splitlines()
    body_start_idx = 0

    # If subject or sender are missing, check if first few lines contain 'From:' or 'Subject:'
    for i, line in enumerate(lines[:6]):
        from_match = re.match(r"^From:\s*(.+)$", line, re.IGNORECASE)
        subj_match = re.match(r"^Subject:\s*(.+)$", line, re.IGNORECASE)
        if from_match and not extracted_sender:
            extracted_sender = from_match.group(1).strip()
            body_start_idx = max(body_start_idx, i + 1)
        elif subj_match and not extracted_subject:
            extracted_subject = subj_match.group(1).strip()
            body_start_idx = max(body_start_idx, i + 1)

    # If headers were found at top followed by empty lines, strip them from body
    if body_start_idx > 0 and body_start_idx < len(lines):
        remaining_lines = lines[body_start_idx:]
        while remaining_lines and not remaining_lines[0].strip():
            remaining_lines.pop(0)
        body = "\n".join(remaining_lines).strip()
        if not body:
            body = text.strip()
    else:
        body = text.strip()

    # Fallback subject if still missing: first line or snippet
    if not extracted_subject:
        first_line = lines[0].strip()
        extracted_subject = (
            (first_line[:60] + "...") if len(first_line) > 60 else first_line
        )

    return extracted_sender, extracted_subject, body


def parse_eml_bytes(content: bytes) -> tuple[str | None, str | None, str]:
    """
    Parses .eml file content using Python standard email library.
    Returns: (sender, subject, body_text)
    """
    try:
        msg = email.message_from_bytes(content, policy=policy.default)
    except Exception as e:
        raise ValueError(f"Failed to parse EML file: {e!s}")

    sender = msg.get("From")
    subject = msg.get("Subject")

    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition") or "")
            if content_type == "text/plain" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    body += (
                        payload.decode(
                            part.get_content_charset() or "utf-8", errors="replace"
                        )
                        + "\n"
                    )
        # If no plain text found, fallback to HTML part stripped
        if not body.strip():
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    payload = part.get_payload(decode=True)
                    if payload:
                        html_text = payload.decode(
                            part.get_content_charset() or "utf-8", errors="replace"
                        )
                        body = re.sub(r"<[^>]+>", " ", html_text)
                        break
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            body = payload.decode(
                msg.get_content_charset() or "utf-8", errors="replace"
            )
        else:
            body = msg.get_payload() or ""

    body = body.strip()
    if not body:
        # Fallback to string representation of message
        body = str(msg)

    if not body.strip():
        raise ValueError("EML email contains no readable body text.")

    return sender, subject, body


def parse_txt_bytes(content: bytes) -> tuple[str | None, str | None, str]:
    """
    Parses .txt file content into sender, subject, and body.
    """
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception as e:
            raise ValueError(f"Could not decode text file: {e!s}")

    return parse_text_input(text)


def parse_pdf_bytes(content: bytes) -> tuple[str | None, str | None, str]:
    """
    Extracts text from a PDF file stream using pypdf.
    """
    try:
        reader = PdfReader(io.BytesIO(content))
        extracted_pages = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_pages.append(t)
        full_text = "\n".join(extracted_pages).strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e!s}")

    if not full_text:
        raise ValueError("PDF file contains no extractable text.")

    return parse_text_input(full_text)


def parse_uploaded_file(
    filename: str, content: bytes
) -> tuple[str | None, str | None, str]:
    """
    Main file parsing dispatcher. Validates file extension, file size, and extracts metadata/body.
    """
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"File size exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    lower_name = (filename or "").lower()
    matched_ext = None
    for ext in ALLOWED_EXTENSIONS:
        if lower_name.endswith(ext):
            matched_ext = ext
            break

    if not matched_ext:
        raise ValueError(
            f"Unsupported file format for '{filename}'. Supported formats: .eml, .txt, .pdf"
        )

    if matched_ext == ".eml":
        return parse_eml_bytes(content)
    elif matched_ext == ".txt":
        return parse_txt_bytes(content)
    elif matched_ext == ".pdf":
        return parse_pdf_bytes(content)
    else:
        raise ValueError(f"Unsupported file format: {matched_ext}")
