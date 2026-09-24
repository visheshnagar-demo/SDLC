import math
import uuid
import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from server.models.entities import Transaction, Alert, AlertViolation
from server.schemas.transactions import (
    TransactionEvaluateRequest,
    TransactionEvaluateResponse,
    TriggeredRuleDetail,
)
from server.services.rules import get_active_rules
from server.services.audit import create_audit_log

# Standard conversion rates to USD
CURRENCY_TO_USD = {
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.28,
    "CAD": 0.74,
    "JPY": 0.0065,
    "AUD": 0.65,
    "CHF": 1.12,
}


def haversine_distance_miles(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    R = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def evaluate_transaction(
    db: Session, request: TransactionEvaluateRequest
) -> tuple[Transaction, TransactionEvaluateResponse]:
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    tx_time = request.timestamp.replace(tzinfo=None) if request.timestamp else now

    # 1. Persist the evaluated transaction
    tx = Transaction(
        id=str(uuid.uuid4()),
        account_id=request.account_id,
        amount=request.amount,
        currency=request.currency.upper(),
        latitude=request.latitude,
        longitude=request.longitude,
        location_name=request.location_name,
        merchant=request.merchant,
        timestamp=tx_time,
        created_at=now,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # 2. Retrieve active rules
    active_rules = get_active_rules(db)
    triggered_rules: list[TriggeredRuleDetail] = []
    rule_score_contributions: list[int] = []
    highest_rule_severity = "LOW"
    severity_rank = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

    # Normalized amount in USD for multi-currency threshold comparisons
    curr_rate = CURRENCY_TO_USD.get(tx.currency, 1.0)
    normalized_usd_amount = tx.amount * curr_rate

    for rule in active_rules:
        rule_params = rule.parameters or {}

        # ----------------------------------------------------
        # Rule 1: High Transaction Amount Rule
        # ----------------------------------------------------
        if rule.rule_type == "AMOUNT_THRESHOLD":
            threshold = float(rule_params.get("threshold_amount", 10000.0))
            if normalized_usd_amount >= threshold:
                diff = normalized_usd_amount - threshold
                triggered_rules.append(
                    TriggeredRuleDetail(
                        rule_id=rule.id,
                        rule_name=rule.name,
                        rule_type=rule.rule_type,
                        details={
                            "threshold_amount": threshold,
                            "actual_amount": tx.amount,
                            "currency": tx.currency,
                            "normalized_usd_amount": round(normalized_usd_amount, 2),
                            "breach_amount": round(diff, 2),
                        },
                    )
                )
                rule_score_contributions.append(45)
                if severity_rank.get(rule.severity, 1) > severity_rank.get(
                    highest_rule_severity, 1
                ):
                    highest_rule_severity = rule.severity

        # ----------------------------------------------------
        # Rule 2: High-Frequency Transaction Velocity Rule
        # ----------------------------------------------------
        elif rule.rule_type == "FREQUENCY_VELOCITY":
            window_seconds = int(rule_params.get("window_seconds", 600))
            max_count = int(rule_params.get("max_count", 5))
            window_start = tx_time - datetime.timedelta(seconds=window_seconds)

            # Query historical transactions for account in window
            prior_count = (
                db.query(Transaction)
                .filter(
                    and_(
                        Transaction.account_id == tx.account_id,
                        Transaction.id != tx.id,
                        Transaction.timestamp >= window_start,
                        Transaction.timestamp <= tx_time,
                    )
                )
                .count()
            )
            total_count = prior_count + 1  # include current transaction

            if total_count >= max_count:
                triggered_rules.append(
                    TriggeredRuleDetail(
                        rule_id=rule.id,
                        rule_name=rule.name,
                        rule_type=rule.rule_type,
                        details={
                            "window_seconds": window_seconds,
                            "max_count": max_count,
                            "actual_count": total_count,
                            "time_window_start": window_start.isoformat(),
                        },
                    )
                )
                rule_score_contributions.append(40)
                if severity_rank.get(rule.severity, 1) > severity_rank.get(
                    highest_rule_severity, 1
                ):
                    highest_rule_severity = rule.severity

        # ----------------------------------------------------
        # Rule 3: Geographic Velocity (Impossible Travel) Rule
        # ----------------------------------------------------
        elif rule.rule_type == "GEOGRAPHIC_VELOCITY":
            if tx.latitude is not None and tx.longitude is not None:
                speed_threshold_mph = float(
                    rule_params.get("speed_threshold_mph", 500.0)
                )
                max_window_seconds = int(rule_params.get("max_window_seconds", 3600))

                # Find immediate prior transaction with coordinates
                prev_tx = (
                    db.query(Transaction)
                    .filter(
                        and_(
                            Transaction.account_id == tx.account_id,
                            Transaction.id != tx.id,
                            Transaction.latitude.isnot(None),
                            Transaction.longitude.isnot(None),
                            Transaction.timestamp <= tx_time,
                        )
                    )
                    .order_by(desc(Transaction.timestamp))
                    .first()
                )

                if (
                    prev_tx
                    and prev_tx.latitude is not None
                    and prev_tx.longitude is not None
                ):
                    delta_seconds = (tx_time - prev_tx.timestamp).total_seconds()
                    if 0 < delta_seconds <= max_window_seconds:
                        dist_miles = haversine_distance_miles(
                            prev_tx.latitude,
                            prev_tx.longitude,
                            tx.latitude,
                            tx.longitude,
                        )
                        hours = delta_seconds / 3600.0
                        implied_speed = dist_miles / hours if hours > 0 else 0.0

                        if implied_speed > speed_threshold_mph:
                            triggered_rules.append(
                                TriggeredRuleDetail(
                                    rule_id=rule.id,
                                    rule_name=rule.name,
                                    rule_type=rule.rule_type,
                                    details={
                                        "previous_location": f"{prev_tx.location_name or 'Prev'} ({prev_tx.latitude}, {prev_tx.longitude})",
                                        "current_location": f"{tx.location_name or 'Curr'} ({tx.latitude}, {tx.longitude})",
                                        "distance_miles": round(dist_miles, 2),
                                        "time_diff_minutes": round(
                                            delta_seconds / 60.0, 2
                                        ),
                                        "implied_speed_mph": round(implied_speed, 2),
                                        "speed_threshold_mph": speed_threshold_mph,
                                    },
                                )
                            )
                            rule_score_contributions.append(55)
                            if severity_rank.get(rule.severity, 1) > severity_rank.get(
                                highest_rule_severity, 1
                            ):
                                highest_rule_severity = rule.severity

    # 3. Compound Severity & Score Calculation
    is_suspicious = len(triggered_rules) > 0
    calculated_risk_score = 0
    final_severity: Optional[str] = None
    created_alert_id: Optional[str] = None

    if is_suspicious:
        # Sum rule contributions + compound synergy boost for multiple violations
        base_score = sum(rule_score_contributions)
        if len(triggered_rules) >= 2:
            base_score += 15  # compound escalation
        calculated_risk_score = min(100, max(10, base_score))

        # Determine severity level
        if calculated_risk_score >= 80 or highest_rule_severity == "CRITICAL":
            final_severity = "CRITICAL"
        elif calculated_risk_score >= 60 or highest_rule_severity == "HIGH":
            final_severity = "HIGH"
        elif calculated_risk_score >= 30:
            final_severity = "MEDIUM"
        else:
            final_severity = "LOW"

        # 4. Persist Alert & AlertViolations
        created_alert_id = str(uuid.uuid4())
        alert = Alert(
            id=created_alert_id,
            transaction_id=tx.id,
            account_id=tx.account_id,
            severity=final_severity,
            risk_score=calculated_risk_score,
            status="NEW",
            notes=None,
            assigned_to=None,
            created_at=now,
            updated_at=now,
        )
        db.add(alert)
        db.commit()

        for tr in triggered_rules:
            violation = AlertViolation(
                id=str(uuid.uuid4()),
                alert_id=alert.id,
                rule_id=tr.rule_id,
                rule_name=tr.rule_name,
                violation_details=tr.details,
                created_at=now,
            )
            db.add(violation)
        db.commit()

        # Create audit log for alert creation
        create_audit_log(
            db=db,
            entity_type="ALERT",
            entity_id=alert.id,
            action="CREATE",
            actor="system-rule-engine",
            changes={
                "severity": alert.severity,
                "risk_score": alert.risk_score,
                "status": "NEW",
                "triggered_rules": [tr.rule_name for tr in triggered_rules],
            },
        )

    response = TransactionEvaluateResponse(
        transaction_id=tx.id,
        account_id=tx.account_id,
        is_suspicious=is_suspicious,
        risk_score=calculated_risk_score,
        severity=final_severity,
        triggered_rules=triggered_rules,
        alert_id=created_alert_id,
    )
    return tx, response
