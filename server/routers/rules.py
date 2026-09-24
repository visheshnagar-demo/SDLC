from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.rules import (
    RuleCreate,
    RuleUpdate,
    RuleToggleRequest,
    RuleResponse,
)
from server.services.rules import (
    list_rules,
    get_rule_by_id,
    create_rule,
    update_rule,
    toggle_rule,
)

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get(
    "",
    response_model=list[RuleResponse],
    summary="List all configured detection rules",
)
def get_all_rules(db: Session = Depends(get_db)):
    rules = list_rules(db)
    return [RuleResponse.model_validate(r) for r in rules]


@router.post(
    "",
    response_model=RuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new detection rule",
)
def create_new_rule(
    rule_in: RuleCreate,
    actor: Optional[str] = Query("admin@bank.com"),
    db: Session = Depends(get_db),
):
    rule = create_rule(db, rule_in, actor=actor)
    return RuleResponse.model_validate(rule)


@router.get(
    "/{id}",
    response_model=RuleResponse,
    summary="Get detection rule by ID",
)
def get_rule(id: str, db: Session = Depends(get_db)):
    rule = get_rule_by_id(db, id)
    return RuleResponse.model_validate(rule)


@router.put(
    "/{id}",
    response_model=RuleResponse,
    summary="Update detection rule parameters and severity",
)
def update_existing_rule(
    id: str,
    rule_in: RuleUpdate,
    actor: Optional[str] = Query("admin@bank.com"),
    db: Session = Depends(get_db),
):
    rule = update_rule(db, id, rule_in, actor=actor)
    return RuleResponse.model_validate(rule)


@router.patch(
    "/{id}/toggle",
    response_model=RuleResponse,
    summary="Toggle detection rule active status",
)
def toggle_rule_active(
    id: str,
    body: Optional[RuleToggleRequest] = None,
    actor: Optional[str] = Query("admin@bank.com"),
    db: Session = Depends(get_db),
):
    is_active = body.is_active if body else None
    rule = toggle_rule(db, id, is_active=is_active, actor=actor)
    return RuleResponse.model_validate(rule)
