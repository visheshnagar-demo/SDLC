from server.app.services.ai_classifier import (
    classify_email_content,
)


def test_urgent_classification():
    text = "Immediate action required: The production database cluster is down due to a critical incident."
    subject = "Sev-1 Emergency Outage"
    cat, conf, scores = classify_email_content(text, subject)
    assert cat == "Urgent"
    assert conf >= 80.0
    assert scores["Urgent"] >= 80.0


def test_promotional_classification():
    text = "Don't miss out on our limited time discount! Shop now to save 50% with exclusive coupon codes."
    subject = "Flash Sale Deal!"
    cat, conf, scores = classify_email_content(text, subject)
    assert cat == "Promotional"
    assert conf >= 70.0
    assert "Promotional" in scores


def test_work_classification():
    text = "Hi team, please find the sprint backlog and quarterly project roadmap for our architecture sync meeting."
    subject = "Sprint Roadmap & Deliverables Review"
    cat, conf, scores = classify_email_content(text, subject)
    assert cat == "Work"
    assert conf >= 70.0


def test_personal_classification():
    text = "Hey! Let's get together for birthday dinner and barbecue with family and friends this weekend."
    subject = "Family BBQ this Saturday"
    cat, conf, scores = classify_email_content(text, subject)
    assert cat == "Personal"
    assert conf >= 65.0


def test_neutral_fallback_classification():
    text = "The quick brown fox jumps over the lazy dog."
    cat, conf, scores = classify_email_content(text, "")
    assert cat in ["Work", "Personal", "Urgent", "Promotional"]
    assert conf > 0
    assert len(scores) == 4
