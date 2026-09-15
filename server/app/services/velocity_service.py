from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from server.app.core.config import settings
from server.app.models.ach_transfer import AchTransfer
from server.app.schemas.ach_transfer import (
    AchTransferEvaluateRequest,
    AchTransferResponse,
    VelocityLimitExceededResponse,
)


class VelocityLimitExceededException(Exception):
    def __init__(self, data: VelocityLimitExceededResponse):
        self.data = data
        super().__init__(data.detail)


class VelocityService:
    @staticmethod
    def get_rolling_24h_sum(
        db: Session,
        account_id: str | UUID,
        reference_time: Optional[datetime] = None,
    ) -> float:
        """
        Calculate the sum of all approved outbound ACH transfers for this account_id
        in the rolling 24-hour window prior to reference_time (default: now UTC).
        """
        if reference_time is None:
            reference_time = datetime.now(timezone.utc)

        window_start = reference_time - timedelta(hours=settings.VELOCITY_WINDOW_HOURS)
        account_id_str = str(account_id)

        stmt = select(func.coalesce(func.sum(AchTransfer.amount), 0.0)).where(
            AchTransfer.account_id == account_id_str,
            AchTransfer.direction == "OUTBOUND",
            AchTransfer.transfer_type == "ACH",
            AchTransfer.status == "APPROVED",
            AchTransfer.created_at >= window_start,
            AchTransfer.created_at <= reference_time,
        )
        total = db.execute(stmt).scalar()
        return round(float(total or 0.0), 2)

    @staticmethod
    def evaluate_and_record_transfer(
        db: Session,
        transfer_req: AchTransferEvaluateRequest,
        correlation_id: str,
    ) -> AchTransferResponse:
        """
        Evaluates the requested ACH transfer against rolling 24-hour velocity limits:
        1. Hard limit > $10,000 -> Records rejection and raises VelocityLimitExceededException (HTTP 429)
        2. Soft limit > $5,000 and <= $10,000 -> Approves with requires_aml_review = True (HTTP 201)
        3. Normal <= $5,000 -> Approves with requires_aml_review = False (HTTP 201)
        """
        account_id_str = str(transfer_req.account_id)
        current_24h_total = VelocityService.get_rolling_24h_sum(db, account_id_str)
        projected_total = round(current_24h_total + transfer_req.amount, 2)

        # 1. Hard Limit Check (> $10,000.00)
        if projected_total > settings.HARD_LIMIT_THRESHOLD:
            # Record the rejected transaction for audit tracing
            rejected_record = AchTransfer(
                account_id=account_id_str,
                amount=Decimal(str(transfer_req.amount)),
                direction="OUTBOUND",
                transfer_type="ACH",
                status="REJECTED",
                requires_aml_review=False,
                correlation_id=str(correlation_id),
                recipient_account=transfer_req.recipient_account,
                routing_number=transfer_req.routing_number,
            )
            db.add(rejected_record)
            db.commit()

            raise VelocityLimitExceededException(
                VelocityLimitExceededResponse(
                    error_code="VELOCITY_LIMIT_EXCEEDED",
                    detail="Rolling 24-hour ACH transfer limit exceeded.",
                    account_id=transfer_req.account_id,
                    attempted_amount=transfer_req.amount,
                    current_24h_total=current_24h_total,
                    projected_24h_total=projected_total,
                    limit=settings.HARD_LIMIT_THRESHOLD,
                )
            )

        # 2. Soft Limit Check (> $5,000.00 and <= $10,000.00) vs Normal (<= $5,000.00)
        requires_aml = projected_total > settings.SOFT_LIMIT_THRESHOLD

        approved_record = AchTransfer(
            account_id=account_id_str,
            amount=Decimal(str(transfer_req.amount)),
            direction="OUTBOUND",
            transfer_type="ACH",
            status="APPROVED",
            requires_aml_review=requires_aml,
            correlation_id=str(correlation_id),
            recipient_account=transfer_req.recipient_account,
            routing_number=transfer_req.routing_number,
        )
        db.add(approved_record)
        db.commit()
        db.refresh(approved_record)

        return AchTransferResponse(
            transfer_id=UUID(approved_record.id),
            account_id=UUID(approved_record.account_id),
            amount=float(approved_record.amount),
            rolling_24h_total=projected_total,
            status=approved_record.status,
            requires_aml_review=approved_record.requires_aml_review,
            created_at=approved_record.created_at,
        )
