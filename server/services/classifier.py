import re
from typing import Tuple

CATEGORIES = ["Work", "Personal", "Urgent", "Promotional", "Uncategorized"]

KEYWORD_RULES = {
    "Urgent": [
        r"\burgent\b",
        r"\bimmediate\b",
        r"\baction required\b",
        r"\basap\b",
        r"\bcritical\b",
        r"\balert\b",
        r"\bemergency\b",
        r"\bdeadline\b",
        r"\bexpiring\b",
        r"\bfailure\b",
        r"\bhigh priority\b",
        r"\bdanger\b",
        r"\bescalat(e|ion)\b",
        r"\bseverity\s*1\b",
        r"\bsev-?1\b",
    ],
    "Work": [
        r"\bmeeting\b",
        r"\bproject\b",
        r"\breport\b",
        r"\bsprint\b",
        r"\bclient\b",
        r"\bcontract\b",
        r"\binvoice\b",
        r"\bteam\b",
        r"\breview\b",
        r"\bagenda\b",
        r"\bpresentation\b",
        r"\btask\b",
        r"\bstatus\b",
        r"\bsync\b",
        r"\bdeployment\b",
        r"\bjira\b",
        r"\bcode\b",
        r"\bquarterly\b",
        r"\bbudget\b",
        r"\bproposal\b",
        r"\bdeliverable\b",
        r"\bschedule\b",
        r"\bremediation\b",
        r"\brunbook\b",
        r"\bproduction\b",
        r"\bdevops\b",
        r"\barchitecture\b",
    ],
    "Personal": [
        r"\bfamily\b",
        r"\bvacation\b",
        r"\bdinner\b",
        r"\bparty\b",
        r"\blunch\b",
        r"\bweekend\b",
        r"\bholiday\b",
        r"\bfriend\b",
        r"\bbirthday\b",
        r"\bhome\b",
        r"\bdoctor\b",
        r"\btrip\b",
        r"\bpersonal\b",
        r"\breunion\b",
        r"\bwedding\b",
        r"\bbarbecue\b",
        r"\bbbq\b",
        r"\bmovie\b",
        r"\bkids\b",
    ],
    "Promotional": [
        r"\bdiscount\b",
        r"\bsale\b",
        r"\boffer\b",
        r"\bdeal\b",
        r"\bpromo\b",
        r"\bpromotional\b",
        r"\bcoupon\b",
        r"\bspecial offer\b",
        r"\bfree\b",
        r"\bsubscribe\b",
        r"\bnewsletter\b",
        r"\bsave\b",
        r"\b%\s*off\b",
        r"\bclearance\b",
        r"\bexclusive\b",
        r"\bshop now\b",
        r"\blimited time\b",
        r"\bblack friday\b",
        r"\bcyber monday\b",
        r"\bvoucher\b",
        r"\bprize\b",
        r"\breward\b",
        r"\bcash\s*back\b",
    ],
}


def classify_email(text: str, subject: str = "") -> Tuple[str, float]:
    """
    Classifies an email into Work, Personal, Urgent, Promotional, or Uncategorized
    and calculates a confidence score (0.00 - 1.00).
    Empty or low-confidence (<0.50) emails result in 'Uncategorized'.
    """
    combined = f"{subject or ''} {text or ''}".strip()
    if not combined:
        return "Uncategorized", 0.00

    scores = {}
    subject_lower = (subject or "").lower()
    text_lower = (text or "").lower()

    for category, patterns in KEYWORD_RULES.items():
        match_count = 0
        for pattern in patterns:
            # Subject matches carry double weight
            if re.search(pattern, subject_lower, re.IGNORECASE):
                match_count += 2
            if re.search(pattern, text_lower, re.IGNORECASE):
                match_count += 1

        if match_count > 0:
            # Base confidence of 0.70 plus incremental boost per match up to 0.98
            confidence = min(0.70 + (match_count * 0.06), 0.98)
            scores[category] = confidence

    if not scores:
        return "Uncategorized", 0.35

    # Determine highest scoring category
    best_category, highest_score = max(scores.items(), key=lambda x: x[1])

    if highest_score < 0.50:
        return "Uncategorized", round(highest_score, 2)

    return best_category, round(highest_score, 2)
