import re
from typing import Tuple

VALID_CATEGORIES = ["Work", "Personal", "Urgent", "Promotional", "Uncategorized"]
UNCATEGORIZED_THRESHOLD = 0.50

CATEGORY_KEYWORDS = {
    "Urgent": [
        r"\burgent\b",
        r"\basap\b",
        r"\bemergency\b",
        r"\bcritical\b",
        r"\balert\b",
        r"\bdeadline\b",
        r"\bsecurity\b",
        r"\baction\s+required\b",
        r"\bexpiring\b",
        r"\bdown\b",
        r"\bfailure\b",
        r"\bbreach\b",
        r"\bimmediately\b",
        r"\bp1\b",
        r"\boutage\b",
        r"\bincident\b",
        r"\bescalation\b",
        r"\bserver\s+down\b",
    ],
    "Promotional": [
        r"\bdiscount\b",
        r"\boffer\b",
        r"\bsale\b",
        r"\bpromo\b",
        r"\bdeals?\b",
        r"\bvoucher\b",
        r"\bcoupon\b",
        r"\bunsubscribe\b",
        r"\bnewsletter\b",
        r"\bspecial\s+pricing\b",
        r"\bclearance\b",
        r"\bmarketing\b",
        r"\bsubscribe\b",
        r"\bwebinar\b",
        r"\b%\s*off\b",
        r"\bfree\s+trial\b",
        r"\bexclusive\s+deal\b",
    ],
    "Personal": [
        r"\bfamily\b",
        r"\bdinner\b",
        r"\bbirthday\b",
        r"\bweekend\b",
        r"\bvacation\b",
        r"\bparty\b",
        r"\bfriend\b",
        r"\bmom\b",
        r"\bdad\b",
        r"\bbrother\b",
        r"\bsister\b",
        r"\bholiday\b",
        r"\blunch\b",
        r"\bcoffee\b",
        r"\bpicnic\b",
        r"\bwedding\b",
        r"\bcongrats\b",
        r"\bcatching\s+up\b",
        r"\btrip\b",
        r"\bhow\s+are\s+you\b",
    ],
    "Work": [
        r"\bsprint\b",
        r"\bmeeting\b",
        r"\bclient\b",
        r"\bproject\b",
        r"\bcontract\b",
        r"\binvoice\b",
        r"\barchitecture\b",
        r"\breview\b",
        r"\bjira\b",
        r"\bsync\b",
        r"\bdeliverable\b",
        r"\bstandup\b",
        r"\bdeploy\b",
        r"\brelease\b",
        r"\broadmap\b",
        r"\bcustomer\b",
        r"\bdocumentation\b",
        r"\bbackend\b",
        r"\bfrontend\b",
        r"\bpull\s+request\b",
        r"\bticket\b",
        r"\bagile\b",
    ],
}


def classify_email(subject: str = "", body: str = "") -> Tuple[str, float]:
    """
    Classifies an email based on its subject and body.
    Returns (category, confidence_score).
    If confidence_score < 0.50, category is 'Uncategorized'.
    """
    subject_text = (subject or "").lower()
    body_text = (body or "").lower()

    if not subject_text.strip() and not body_text.strip():
        return "Uncategorized", 0.00

    scores = {}

    for cat, patterns in CATEGORY_KEYWORDS.items():
        score = 0.0
        for pat in patterns:
            # Subject matches are weighted higher
            subject_matches = len(re.findall(pat, subject_text, re.IGNORECASE))
            body_matches = len(re.findall(pat, body_text, re.IGNORECASE))
            score += subject_matches * 2.5 + body_matches * 1.0
        scores[cat] = score

    best_category = max(scores, key=lambda k: scores[k])
    max_raw_score = scores[best_category]

    if max_raw_score <= 0.0:
        return "Uncategorized", 0.00

    # Urgent gets priority when equal score
    if scores.get("Urgent", 0) > 0 and scores["Urgent"] >= max_raw_score * 0.9:
        best_category = "Urgent"
        max_raw_score = scores["Urgent"]

    # Calculate confidence score between 0.50 and 0.98 for matching text
    confidence = min(0.98, 0.55 + (max_raw_score * 0.08))
    confidence = round(confidence, 2)

    if confidence < UNCATEGORIZED_THRESHOLD:
        return "Uncategorized", confidence

    return best_category, confidence
