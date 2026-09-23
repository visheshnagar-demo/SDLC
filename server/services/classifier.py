import re
import math
from typing import Tuple, Optional, Dict

CATEGORIES = ["Work", "Personal", "Urgent", "Promotional"]

# Weighted keyword lists for high-precision zero-shot classification
CATEGORY_KEYWORDS = {
    "Urgent": {
        "urgent": 3.5,
        "urgently": 3.5,
        "asap": 4.0,
        "immediate": 3.5,
        "immediately": 3.5,
        "critical": 3.5,
        "action required": 4.0,
        "expiring": 3.0,
        "expires": 3.0,
        "sla": 3.0,
        "emergency": 4.0,
        "alert": 3.0,
        "warning": 2.5,
        "security warning": 4.0,
        "outage": 3.5,
        "24h": 2.5,
        "deadline": 3.0,
        "high priority": 3.5,
        "incident": 3.0,
        "server down": 4.0,
        "breach": 3.5,
        "escalation": 3.0,
        "production down": 4.0,
    },
    "Promotional": {
        "discount": 3.5,
        "offer": 2.5,
        "sale": 3.5,
        "coupon": 4.0,
        "promo": 3.5,
        "special deal": 3.5,
        "newsletter": 3.0,
        "unsubscribe": 3.5,
        "% off": 4.0,
        "percent off": 4.0,
        "black friday": 4.0,
        "cyber monday": 4.0,
        "marketing": 3.0,
        "webinar": 2.5,
        "buy now": 3.5,
        "free trial": 3.0,
        "shop now": 3.5,
        "save big": 3.5,
        "exclusive deal": 3.5,
        "promotion": 3.0,
        "gift card": 3.0,
        "clearance": 3.5,
        "limited time": 3.0,
    },
    "Work": {
        "meeting": 3.0,
        "agenda": 3.0,
        "project": 2.5,
        "review": 2.0,
        "q1": 2.5,
        "q2": 2.5,
        "q3": 2.5,
        "q4": 2.5,
        "team": 2.0,
        "client": 2.5,
        "contract": 3.0,
        "financial": 2.5,
        "quarterly": 2.5,
        "report": 2.0,
        "presentation": 2.5,
        "deployment": 3.0,
        "pull request": 3.5,
        "jira": 3.5,
        "sprint": 3.5,
        "standup": 3.5,
        "deliverable": 3.0,
        "invoice": 3.0,
        "payroll": 3.0,
        "stakeholder": 3.0,
        "budget": 2.5,
        "roadmap": 2.5,
        "sync": 2.0,
        "architecture": 2.5,
        "backend": 2.5,
        "frontend": 2.5,
    },
    "Personal": {
        "dinner": 3.0,
        "family": 3.5,
        "vacation": 3.0,
        "weekend": 2.5,
        "birthday": 3.5,
        "party": 3.0,
        "catch up": 3.0,
        "lunch": 2.5,
        "coffee": 2.0,
        "mom": 3.5,
        "dad": 3.5,
        "sister": 3.5,
        "brother": 3.5,
        "friend": 2.5,
        "home": 2.0,
        "photos": 2.5,
        "trip": 2.5,
        "personal": 3.0,
        "holiday": 2.5,
        "bbq": 3.5,
        "reunion": 3.5,
        "hangout": 3.0,
        "movie": 2.5,
        "cinema": 2.5,
        "recipes": 3.0,
    },
}


def classify_email(subject: Optional[str], body: str) -> Tuple[str, float]:
    """
    Classify email content into Work, Personal, Urgent, Promotional, or Uncategorized.

    Returns:
        (category: str, confidence_score: float)

    Rules:
    - Empty or whitespace text -> Uncategorized, score = 0.00
    - If top confidence < 0.50 -> Uncategorized, score = top_score
    - If top confidence >= 0.50 -> top_category, score = top_score
    """
    subject_text = (subject or "").strip().lower()
    body_text = (body or "").strip().lower()

    if not subject_text and not body_text:
        return "Uncategorized", 0.00

    raw_scores: Dict[str, float] = {cat: 0.0 for cat in CATEGORIES}

    # Weight subject higher (2.0x) than body
    for cat, kw_dict in CATEGORY_KEYWORDS.items():
        for kw, weight in kw_dict.items():
            # Check in subject
            if kw in subject_text:
                count_subj = (
                    len(re.findall(r"\b" + re.escape(kw) + r"\b", subject_text)) or 1
                )
                raw_scores[cat] += weight * count_subj * 2.0
            # Check in body
            if kw in body_text:
                count_body = (
                    len(re.findall(r"\b" + re.escape(kw) + r"\b", body_text)) or 1
                )
                raw_scores[cat] += weight * min(count_body, 3)

    total_raw = sum(raw_scores.values())

    if total_raw == 0:
        return "Uncategorized", 0.00

    # Calculate normalized probability distribution
    # Apply softmax with temperature or proportional normalization
    exp_scores = {cat: math.exp(score) for cat, score in raw_scores.items()}
    sum_exp = sum(exp_scores.values())
    probabilities = {cat: exp_scores[cat] / sum_exp for cat in CATEGORIES}

    # Find highest scoring category
    top_cat = max(probabilities.keys(), key=lambda c: (raw_scores[c], probabilities[c]))
    top_prob = probabilities[top_cat]

    # Map raw score confidence into realistic 0.50 - 0.98 range if strong match
    if raw_scores[top_cat] >= 3.0:
        # High confidence signal
        confidence = min(0.98, max(0.75, top_prob))
    elif raw_scores[top_cat] > 0.0:
        confidence = min(0.74, max(0.50, top_prob))
    else:
        confidence = round(top_prob, 2)

    confidence = round(confidence, 2)

    if confidence < 0.50:
        return "Uncategorized", confidence

    return top_cat, confidence
