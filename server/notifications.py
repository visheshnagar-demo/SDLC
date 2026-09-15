import logging

from server.models import User, Visit, Visitor

logger = logging.getLogger("notifications")


def notify_host_incoming_request(visit: Visit, host: User, visitor: Visitor) -> dict:
    """Dispatches email/push notification to host employee regarding incoming visit request."""
    subject = f"Visitor Request: {visitor.full_name} for {visit.purpose}"
    message = (
        f"Hello {host.full_name},\n\n"
        f"Visitor {visitor.full_name} ({visitor.email}, Company: {visitor.company or 'N/A'}) "
        f"has requested a visit on {visit.scheduled_start_time.isoformat()}.\n"
        f"Purpose: {visit.purpose}\n\n"
        f"Please log in to your portal to Approve or Reject this request."
    )
    logger.info("Sending notification to host %s: %s", host.email, subject)
    return {
        "recipient": host.email,
        "subject": subject,
        "message": message,
        "status": "SENT",
    }


def notify_visitor_decision(
    visit: Visit,
    visitor: Visitor,
    host: User,
    action: str,
    pass_code: str | None = None,
    notes: str | None = None,
) -> dict:
    """Dispatches pass invitation or rejection notice to visitor."""
    if action == "APPROVE":
        subject = "Your Office Visitor Pass is Approved!"
        message = (
            f"Dear {visitor.full_name},\n\n"
            f"Your visit with {host.full_name} on {visit.scheduled_start_time.isoformat()} has been APPROVED.\n"
            f"Your Pass Code is: {pass_code}\n\n"
            f"Host Notes: {notes or 'None'}\n\n"
            f"Please present this pass code to the receptionist upon your arrival."
        )
    else:
        subject = "Update regarding your Office Visitor Request"
        message = (
            f"Dear {visitor.full_name},\n\n"
            f"Your visit request with {host.full_name} could not be approved at this time.\n"
            f"Host Notes: {notes or 'None'}"
        )
    logger.info(
        "Sending decision notification to visitor %s: %s", visitor.email, subject
    )
    return {
        "recipient": visitor.email,
        "subject": subject,
        "message": message,
        "status": "SENT",
    }
