import uuid
import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException
from server.models.entities import Rule
from server.schemas.rules import RuleCreate, RuleUpdate
from server.services.audit import create_audit_log


def validate_rule_parameters(rule_type: str, parameters: dict):
    if rule_type == "AMOUNT_THRESHOLD":
        threshold = parameters.get("threshold_amount")
        if threshold is None or float(threshold) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Validation error: threshold_amount must be greater than 0",
            )
    elif rule_type == "FREQUENCY_VELOCITY":
        max_count = parameters.get("max_count")
        window_seconds = parameters.get("window_seconds")
        if max_count is None or int(max_count) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Validation error: max_count must be a positive integer",
            )
        if window_seconds is None or int(window_seconds) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Validation error: window_seconds must be a positive integer",
            )
    elif rule_type == "GEOGRAPHIC_VELOCITY":
        speed_threshold = parameters.get("speed_threshold_mph")
        max_window = parameters.get("max_window_seconds")
        if speed_threshold is None or float(speed_threshold) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Validation error: speed_threshold_mph must be greater than 0",
            )
        if max_window is not None and int(max_window) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Validation error: max_window_seconds must be a positive integer",
            )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Validation error: Unknown rule_type '{rule_type}'",
        )


def list_rules(db: Session) -> list[Rule]:
    return db.query(Rule).order_by(desc(Rule.created_at)).all()


def get_active_rules(db: Session) -> list[Rule]:
    return db.query(Rule).filter(Rule.is_active == True).all()  # noqa: E712


def get_rule_by_id(db: Session, rule_id: str) -> Rule:
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule with ID {rule_id} not found")
    return rule


def create_rule(
    db: Session, rule_in: RuleCreate, actor: str = "admin@bank.com"
) -> Rule:
    validate_rule_parameters(rule_in.rule_type, rule_in.parameters)
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    rule = Rule(
        id=str(uuid.uuid4()),
        name=rule_in.name,
        rule_type=rule_in.rule_type,
        description=rule_in.description,
        severity=rule_in.severity.upper(),
        is_active=rule_in.is_active,
        parameters=rule_in.parameters,
        created_at=now,
        updated_at=now,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    create_audit_log(
        db=db,
        entity_type="RULE",
        entity_id=rule.id,
        action="CREATE",
        actor=actor,
        changes={
            "name": rule.name,
            "rule_type": rule.rule_type,
            "severity": rule.severity,
            "is_active": rule.is_active,
            "parameters": rule.parameters,
        },
    )
    return rule


def update_rule(
    db: Session,
    rule_id: str,
    rule_in: RuleUpdate,
    actor: str = "admin@bank.com",
) -> Rule:
    rule = get_rule_by_id(db, rule_id)
    changes = {}

    target_rule_type = rule_in.rule_type or rule.rule_type
    target_parameters = (
        rule_in.parameters if rule_in.parameters is not None else rule.parameters
    )
    validate_rule_parameters(target_rule_type, target_parameters)

    if rule_in.name is not None and rule_in.name != rule.name:
        changes["name"] = {"old": rule.name, "new": rule_in.name}
        rule.name = rule_in.name
    if rule_in.rule_type is not None and rule_in.rule_type != rule.rule_type:
        changes["rule_type"] = {"old": rule.rule_type, "new": rule_in.rule_type}
        rule.rule_type = rule_in.rule_type
    if rule_in.description is not None and rule_in.description != rule.description:
        changes["description"] = {"old": rule.description, "new": rule_in.description}
        rule.description = rule_in.description
    if rule_in.severity is not None and rule_in.severity.upper() != rule.severity:
        changes["severity"] = {"old": rule.severity, "new": rule_in.severity.upper()}
        rule.severity = rule_in.severity.upper()
    if rule_in.is_active is not None and rule_in.is_active != rule.is_active:
        changes["is_active"] = {"old": rule.is_active, "new": rule_in.is_active}
        rule.is_active = rule_in.is_active
    if rule_in.parameters is not None and rule_in.parameters != rule.parameters:
        changes["parameters"] = {"old": rule.parameters, "new": rule_in.parameters}
        rule.parameters = rule_in.parameters

    rule.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(rule)

    if changes:
        create_audit_log(
            db=db,
            entity_type="RULE",
            entity_id=rule.id,
            action="UPDATE",
            actor=actor,
            changes=changes,
        )
    return rule


def toggle_rule(
    db: Session,
    rule_id: str,
    is_active: Optional[bool] = None,
    actor: str = "admin@bank.com",
) -> Rule:
    rule = get_rule_by_id(db, rule_id)
    new_state = (not rule.is_active) if is_active is None else is_active
    old_state = rule.is_active

    rule.is_active = new_state
    rule.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(rule)

    create_audit_log(
        db=db,
        entity_type="RULE",
        entity_id=rule.id,
        action="TOGGLE_ACTIVE",
        actor=actor,
        changes={"is_active": {"old": old_state, "new": new_state}},
    )
    return rule
