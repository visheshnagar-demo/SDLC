import asyncio
import re

CATEGORY_KEYWORDS = {
    "Urgent": [
        "urgent",
        "immediately",
        "immediate",
        "critical",
        "emergency",
        "alert",
        "outage",
        "incident",
        "downtime",
        "action required",
        "security breach",
        "asap",
        "overdue",
        "failure",
        "fail",
        "latency spike",
        "system down",
        "severity 1",
        "sev-1",
        "sev1",
        "sev 1",
        "down",
        "warning",
        "expiring",
        "high priority",
        "escalation",
        "blocked",
        "p0",
        "p1",
        "database down",
    ],
    "Promotional": [
        "discount",
        "sale",
        "% off",
        "coupon",
        "deal",
        "deals",
        "offer",
        "special offer",
        "free trial",
        "subscribe",
        "newsletter",
        "buy now",
        "promo",
        "promotional",
        "limited time",
        "save big",
        "save $",
        "marketing",
        "black friday",
        "cyber monday",
        "clearance",
        "exclusive invitation",
        "gift card",
        "reward points",
        "shop now",
        "unbeatable price",
        "order now",
        "cashback",
        "webinar invitation",
    ],
    "Work": [
        "meeting",
        "sync",
        "sprint",
        "roadmap",
        "project",
        "deliverables",
        "deliverable",
        "status update",
        "client",
        "invoice",
        "report",
        "presentation",
        "stakeholder",
        "jira",
        "slack",
        "pull request",
        "deployment",
        "production",
        "architecture",
        "budget",
        "contract",
        "agenda",
        "quarterly",
        "q1",
        "q2",
        "q3",
        "q4",
        "okr",
        "kpi",
        "onboarding",
        "performance review",
        "standup",
        "team",
        "colleague",
        "workflow",
        "specification",
        "implementation",
        "code review",
        "ticket",
        "scrum",
    ],
    "Personal": [
        "family",
        "friend",
        "friends",
        "weekend",
        "vacation",
        "dinner",
        "birthday",
        "party",
        "wedding",
        "hiking",
        "bbq",
        "barbecue",
        "travel",
        "catching up",
        "photos",
        "health",
        "doctor appointment",
        "dentist",
        "recipe",
        "home",
        "mom",
        "dad",
        "sister",
        "brother",
        "cousin",
        "reunion",
        "kids",
        "school",
        "holiday trip",
        "anniversary",
        "movies",
        "lunch tomorrow",
        "coffee chat",
    ],
}


def calculate_category_scores(text: str, subject: str = "") -> dict[str, float]:
    """
    Computes scores for each category based on contextual keyword clustering,
    subject line importance, and pattern matching.
    """
    text_lower = (text or "").lower()
    subject_lower = (subject or "").lower()

    raw_scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = 0.0
        for kw in keywords:
            escaped_kw = re.escape(kw)
            pattern = (
                rf"\b{escaped_kw}\b"
                if not kw.startswith("%") and not kw.endswith("%")
                else escaped_kw
            )
            matches_subject = len(re.findall(pattern, subject_lower))
            matches_body = len(re.findall(pattern, text_lower))
            score += (matches_subject * 3.5) + (matches_body * 1.0)

        raw_scores[cat] = score

    total_score = sum(raw_scores.values())

    probabilities = {}
    if total_score == 0:
        probabilities = {
            "Work": 55.00,
            "Personal": 45.00,
            "Urgent": 20.00,
            "Promotional": 15.00,
        }
    else:
        for cat, raw in raw_scores.items():
            if raw > 0:
                ratio = raw / total_score
                confidence = min(
                    99.00, max(65.00, 60.00 + (ratio * 38.00) + min(raw * 2.0, 10.0))
                )
                probabilities[cat] = round(confidence, 2)
            else:
                probabilities[cat] = round(max(5.0, 20.0 - (total_score * 1.5)), 2)

    return probabilities


def classify_email_content(
    text: str, subject: str = ""
) -> tuple[str, float, dict[str, float]]:
    """
    Synchronous classification of email text returning (primary_category, confidence_score, all_scores).
    """
    scores = calculate_category_scores(text, subject)

    urgent_score = scores.get("Urgent", 0.0)
    if urgent_score >= 80.00:
        primary = "Urgent"
        confidence = urgent_score
    else:
        primary = max(scores, key=lambda k: scores[k])
        confidence = scores[primary]

    confidence = round(float(confidence), 2)
    return primary, confidence, scores


async def classify_email_content_async(
    text: str,
    subject: str = "",
    timeout_seconds: float = 5.0,
) -> tuple[str, float, dict[str, float]]:
    """
    Asynchronous classification wrapper with timeout guard to handle AI service delays.
    """
    try:
        loop = asyncio.get_running_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(None, classify_email_content, text, subject),
            timeout=timeout_seconds,
        )
    except asyncio.TimeoutError:
        raise TimeoutError(
            "AI categorization service timed out while analyzing email content."
        )
