from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from server.app.db.session import get_db
from server.app.schemas.ach_transfer import (
    AchTransferEvaluateRequest,
    AchTransferResponse,
    VelocityLimitExceededResponse,
)
from server.app.services.velocity_service import (
    VelocityService,
    VelocityLimitExceededException,
)

router = APIRouter()


@router.post(
    "/evaluate",
    response_model=AchTransferResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "model": AchTransferResponse,
            "description": "ACH Transfer evaluated and approved (may have requires_aml_review=True if > $5,000)",
        },
        429: {
            "model": VelocityLimitExceededResponse,
            "description": "Velocity limit exceeded (> $10,000 in rolling 24-hour period)",
        },
    },
)
def evaluate_ach_transfer(
    transfer_req: AchTransferEvaluateRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    correlation_id = getattr(
        request.state, "correlation_id", "00000000-0000-0000-0000-000000000000"
    )
    try:
        result = VelocityService.evaluate_and_record_transfer(
            db=db,
            transfer_req=transfer_req,
            correlation_id=correlation_id,
        )
        return result
    except VelocityLimitExceededException as exc:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=exc.data.model_dump(mode="json"),
            headers={"X-Correlation-ID": str(correlation_id)},
        )
