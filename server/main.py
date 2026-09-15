import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.config import settings
from server.database import get_db, init_db, seed_data, SessionLocal
from server import crud, services
from server.schemas import (
    KPIOverview,
    SKUItem,
    SKUCreate,
    SKUUpdate,
    ScenarioOption,
    ScenarioEvaluateRequest,
    ScenarioEvaluationResponse,
    ApprovalSubmitRequest,
    ApprovalSubmissionResponse,
    GuardrailCheck
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        seed_data(db)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS setup
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
if not origins:
    origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}


@app.get(f"{settings.API_V1_STR}/kpis", response_model=KPIOverview, tags=["KPIs"])
def get_kpis(
    cluster_name: str = Query("Small Town Value Cluster", description="Store cluster name"),
    db: Session = Depends(get_db)
):
    kpi = crud.get_cluster_kpi(db, cluster_name=cluster_name)
    if not kpi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"KPI metrics not found for cluster '{cluster_name}'"
        )
    return kpi


@app.get(f"{settings.API_V1_STR}/skus", response_model=List[SKUItem], tags=["SKUs"])
def list_skus(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None, description="Search by SKU code or product name"),
    status_badge: Optional[str] = Query(None, description="Filter by status badge: GROW, MAINTAIN, SWAP, REDUCE"),
    is_private_brand: Optional[bool] = Query(None, description="Filter by private brand flag"),
    sort_by: Optional[str] = Query(None, description="Sort field name"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    return crud.get_skus(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status_badge=status_badge,
        is_private_brand=is_private_brand,
        sort_by=sort_by,
        sort_order=sort_order
    )


@app.get(f"{settings.API_V1_STR}/skus/{{sku_id}}", response_model=SKUItem, tags=["SKUs"])
def get_sku(sku_id: str, db: Session = Depends(get_db)):
    sku = crud.get_sku_by_id(db, sku_id)
    if not sku:
        sku = crud.get_sku_by_code(db, sku_id)
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SKU '{sku_id}' not found"
        )
    return sku


@app.post(f"{settings.API_V1_STR}/skus", response_model=SKUItem, status_code=status.HTTP_201_CREATED, tags=["SKUs"])
def create_new_sku(sku_in: SKUCreate, db: Session = Depends(get_db)):
    existing = crud.get_sku_by_code(db, sku_in.sku_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SKU with code '{sku_in.sku_code}' already exists"
        )
    return crud.create_sku(db, sku_in)


@app.put(f"{settings.API_V1_STR}/skus/{{sku_id}}", response_model=SKUItem, tags=["SKUs"])
def update_existing_sku(sku_id: str, sku_in: SKUUpdate, db: Session = Depends(get_db)):
    sku = crud.get_sku_by_id(db, sku_id)
    if not sku:
        sku = crud.get_sku_by_code(db, sku_id)
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SKU '{sku_id}' not found"
        )
    return crud.update_sku(db, sku, sku_in)


@app.get(f"{settings.API_V1_STR}/scenarios", response_model=List[ScenarioOption], tags=["Scenarios"])
def get_scenarios(db: Session = Depends(get_db)):
    return crud.get_scenarios(db)


@app.get(f"{settings.API_V1_STR}/scenarios/{{scenario_code}}", response_model=ScenarioOption, tags=["Scenarios"])
def get_scenario_by_code(scenario_code: str, db: Session = Depends(get_db)):
    scenario = crud.get_scenario_by_code(db, scenario_code)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with code '{scenario_code}' not found"
        )
    return scenario


@app.post(f"{settings.API_V1_STR}/scenarios/evaluate", response_model=ScenarioEvaluationResponse, tags=["Scenarios"])
def evaluate_scenario(request: ScenarioEvaluateRequest, db: Session = Depends(get_db)):
    scenario = crud.get_scenario_by_code(db, request.scenario_code)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with code '{request.scenario_code}' not found"
        )
    return services.evaluate_scenario_impact(scenario)


@app.post(
    f"{settings.API_V1_STR}/approvals/submit",
    response_model=ApprovalSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Approvals"]
)
def submit_approval(request: ApprovalSubmitRequest, db: Session = Depends(get_db)):
    return services.process_approval(db, request)


@app.get(f"{settings.API_V1_STR}/approvals/history", response_model=List[ApprovalSubmissionResponse], tags=["Approvals"])
def get_approval_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    submissions = crud.get_approval_submissions(db, skip=skip, limit=limit)
    response_list = []
    for sub in submissions:
        guardrails = [
            GuardrailCheck(
                name=g.get("name", ""),
                passed=g.get("passed", True),
                actual_value=g.get("actual_value", "")
            )
            for g in (sub.guardrail_status_snapshot or [])
        ]
        response_list.append(
            ApprovalSubmissionResponse(
                audit_id=sub.audit_id,
                submitted_at=sub.created_at,
                manager_id=sub.manager_id,
                scenario_applied=sub.scenario_applied,
                total_sku_actions=sub.total_sku_actions,
                guardrails=guardrails,
                status=sub.status,
                message=sub.message or ""
            )
        )
    return response_list


@app.get(f"{settings.API_V1_STR}/approvals/{{audit_id}}", response_model=ApprovalSubmissionResponse, tags=["Approvals"])
def get_approval_by_audit_id(audit_id: str, db: Session = Depends(get_db)):
    sub = crud.get_approval_submission_by_audit_id(db, audit_id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit submission '{audit_id}' not found"
        )
    guardrails = [
        GuardrailCheck(
            name=g.get("name", ""),
            passed=g.get("passed", True),
            actual_value=g.get("actual_value", "")
        )
        for g in (sub.guardrail_status_snapshot or [])
    ]
    return ApprovalSubmissionResponse(
        audit_id=sub.audit_id,
        submitted_at=sub.created_at,
        manager_id=sub.manager_id,
        scenario_applied=sub.scenario_applied,
        total_sku_actions=sub.total_sku_actions,
        guardrails=guardrails,
        status=sub.status,
        message=sub.message or ""
    )
