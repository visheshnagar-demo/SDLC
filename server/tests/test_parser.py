from email.message import EmailMessage

import pytest

from server.app.services.email_parser import (
    MAX_FILE_SIZE_BYTES,
    parse_eml_bytes,
    parse_text_input,
    parse_txt_bytes,
    parse_uploaded_file,
)


def test_parse_text_input_with_headers():
    raw_text = (
        "From: alice@enterprise.com\n"
        "Subject: Weekly Status Update\n\n"
        "Here is the summary of project milestones achieved this week."
    )
    sender, subject, body = parse_text_input(raw_text)
    assert sender == "alice@enterprise.com"
    assert subject == "Weekly Status Update"
    assert "summary of project milestones" in body


def test_parse_text_input_without_headers():
    raw_text = "Just a quick note about tomorrow's lunch meeting at noon."
    sender, subject, body = parse_text_input(
        raw_text, subject="Meeting", sender="john@doe.com"
    )
    assert sender == "john@doe.com"
    assert subject == "Meeting"
    assert body == raw_text


def test_parse_text_input_empty():
    with pytest.raises(ValueError, match="cannot be empty"):
        parse_text_input("   ")


def test_parse_eml_bytes():
    msg = EmailMessage()
    msg["From"] = "newsletter@marketing.io"
    msg["Subject"] = "Special Promotion: Save 40% Today Only"
    msg.set_content("Don't miss our exclusive deals and discounted pricing plans.")

    sender, subject, body = parse_eml_bytes(msg.as_bytes())
    assert "newsletter@marketing.io" in sender
    assert "Special Promotion" in subject
    assert "exclusive deals" in body


def test_parse_txt_bytes():
    content = b"From: support@desk.com\nSubject: Ticket #1234\n\nYour issue has been resolved."
    sender, subject, body = parse_txt_bytes(content)
    assert sender == "support@desk.com"
    assert subject == "Ticket #1234"
    assert "issue has been resolved" in body


def test_parse_uploaded_file_size_exceeded():
    large_payload = b"A" * (MAX_FILE_SIZE_BYTES + 1024)
    with pytest.raises(ValueError, match="File size exceeds"):
        parse_uploaded_file("large.txt", large_payload)


def test_parse_uploaded_file_unsupported_format():
    with pytest.raises(ValueError, match="Unsupported file format"):
        parse_uploaded_file("archive.zip", b"PK\x03\x04...")
