import random
from datetime import datetime
from typing import List, Dict, Any, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session
from server import crud
from server.models import Scenario
from server.schemas import (
    GuardrailCheck,
    ScenarioEvaluationResponse,
    ApprovalSubmitRequest,
    ApprovalSubmissionResponse
)


def evaluate_guardrails(scenario: Scenario) -> Tuple[List[GuardrailCheck], bool]:
    pb_share = scenario.projected_private_brand_share_pct
    space_displacement = scenario.shelf_space_impact_pct

    pb_passed = pb_share >= 25.0
    space_passed = space_displacement <= 10.0

    guardrails = [
        GuardrailCheck(
            name="Private Brand Share ≥ 25.0%",
            passed=pb_passed,
            actual_value=f"{pb_share:.1f}% ({'PASS ✓' if pb_passed else 'FAIL ✗'})"
        ),
        GuardrailCheck(
            name="Space Displacement ≤ 10.0%",
            passed=space_passed,
            actual_value=f"{space_displacement:.1f}% ({'PASS ✓' if space_passed else 'FAIL ✗'})"
        )
    ]

    all_passed = pb_passed and space_passed
    return guardrails, all_passed


def evaluate_scenario_impact(scenario: Scenario) -> ScenarioEvaluationResponse:
    guardrails, all_passed = evaluate_guardrails(scenario)

    return ScenarioEvaluationResponse(
        scenario_code=scenario.code,
        scenario_title=scenario.title,
        projected_sales_growth_pct=scenario.projected_sales_growth_pct,
        projected_private_brand_share_pct=scenario.projected_private_brand_share_pct,
        shelf_space_impact_pct=scenario.shelf_space_impact_pct,
        sku_actions_summary=scenario.sku_actions_summary,
        guardrails=guardrails,
        can_submit=True
    )


def process_approval(db: Session, request: ApprovalSubmitRequest) -> ApprovalSubmissionResponse:
    scenario = crud.get_scenario_by_code(db, request.scenario_code)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario with code '{request.scenario_code}' not found.")

    guardrails, all_passed = evaluate_guardrails(scenario)

    if not all_passed and not (request.override_comments and request.override_comments.strip()):
        raise HTTPException(
            status_code=400,
            detail="Guardrail check failed. A mandatory override comment is required to submit this plan."
        )

    # Generate Audit ID: AUD-YYYYMMDD-XXX
    now = datetime.utcnow()
    date_str = now.strftime("%Y%m%d")
    random_suffix = f"{random.randint(1, 999):03d}"
    audit_id = f"AUD-{date_str}-{random_suffix}"

    # Calculate total actions
    actions_summary = scenario.sku_actions_summary or {}
    total_sku_actions = sum(actions_summary.values()) if actions_summary else 21

    message = f"Assortment plan successfully submitted for {request.cluster_name}."

    guardrail_dicts = [g.model_dump() for g in guardrails]

    submission = crud.create_approval_submission(
        db=db,
        audit_id=audit_id,
        cluster_name=request.cluster_name or "Small Town Value Cluster",
        manager_id=request.manager_id or "MGR-8842",
        scenario_code=scenario.code,
        scenario_applied=scenario.title,
        total_sku_actions=total_sku_actions,
        sku_actions_snapshot=actions_summary,
        guardrail_status_snapshot=guardrail_dicts,
        override_comments=request.override_comments,
        status="APPROVED",
        message=message
    )

    return ApprovalSubmissionResponse(
        audit_id=submission.audit_id,
        submitted_at=submission.created_at,
        manager_id=submission.manager_id,
        scenario_applied=submission.scenario_applied,
        total_sku_actions=submission.total_sku_actions,
        guardrails=guardrails,
        status=submission.status,
        message=submission.message
    )
