import json
import uuid
import random
import datetime
import hashlib
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.models import (
    Customer,
    SavingsAccount,
    FixedDepositPlan,
    FixedDepositAccount,
    TransactionLedger,
    IdempotencyRecord,
    FDAdviceReceipt,
)
from server.schemas import (
    FDCreateRequest,
    FDCreateResponse,
    FDAccountSummary,
    FDReceiptSummary,
)

MIN_DEPOSIT_THRESHOLD = 500.00


def create_fixed_deposit(
    db: Session,
    request: FDCreateRequest,
    idempotency_key: Optional[str] = None,
    customer_email: Optional[str] = None,
) -> FDCreateResponse:
    # 1. Validate deposit amount threshold
    if request.deposit_amount < MIN_DEPOSIT_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Deposit amount must be at least ${MIN_DEPOSIT_THRESHOLD:,.2f}",
        )

    # 2. Check Idempotency Key if provided
    request_payload_str = json.dumps(
        {
            "source_account_id": request.source_account_id,
            "deposit_amount": request.deposit_amount,
            "tenure_months": request.tenure_months,
            "payout_frequency": request.payout_frequency,
        },
        sort_keys=True,
    )
    request_hash = hashlib.sha256(request_payload_str.encode("utf-8")).hexdigest()

    if idempotency_key:
        cached_record = (
            db.query(IdempotencyRecord)
            .filter(IdempotencyRecord.idempotency_key == idempotency_key)
            .first()
        )
        if cached_record:
            if cached_record.request_hash == request_hash:
                data = json.loads(cached_record.response_body)
                return FDCreateResponse(**data)
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key reused with different request payload.",
                )

    # 3. Validate tenure and retrieve plan
    plan = (
        db.query(FixedDepositPlan)
        .filter(
            FixedDepositPlan.tenure_months == request.tenure_months,
            FixedDepositPlan.is_active == True,  # noqa: E712
        )
        .first()
    )
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tenure duration: {request.tenure_months} months is not a supported plan.",
        )

    # 4. Fetch and validate source savings account
    source_acc = (
        db.query(SavingsAccount)
        .filter(SavingsAccount.id == request.source_account_id)
        .with_for_update()
        .first()
    )
    if not source_acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings account not found.",
        )

    # Fetch customer
    customer = db.query(Customer).filter(Customer.id == source_acc.customer_id).first()

    # 5. Validate Transaction PIN
    valid_pin = "1234"
    if customer and customer.transaction_pin:
        valid_pin = customer.transaction_pin

    if request.transaction_pin != valid_pin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid transaction PIN provided.",
        )

    # 6. Check account status & available balance
    if source_acc.status.upper() != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Source account is not active (current status: {source_acc.status}).",
        )

    if source_acc.balance < request.deposit_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Insufficient available funds in source account (balance: ${source_acc.balance:,.2f}, required: ${request.deposit_amount:,.2f}).",
        )

    # 7. Calculate interest and maturity projection
    interest_rate = plan.interest_rate
    total_interest = round(
        request.deposit_amount * (interest_rate / 100.0) * (request.tenure_months / 12.0),
        2,
    )
    maturity_amount = round(request.deposit_amount + total_interest, 2)
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    maturity_date = now + datetime.timedelta(days=int(request.tenure_months * 30.4375))

    # 8. Execute atomic transaction
    try:
        # Deduct balance from source account
        source_acc.balance = round(source_acc.balance - request.deposit_amount, 2)
        source_acc.updated_at = now

        # Create Fixed Deposit Account
        fd_id = str(uuid.uuid4())
        fd_acc_no = f"FD-{random.randint(100000, 999999)}"
        fd = FixedDepositAccount(
            id=fd_id,
            customer_id=source_acc.customer_id,
            source_account_id=source_acc.id,
            fd_account_number=fd_acc_no,
            deposit_amount=round(request.deposit_amount, 2),
            interest_rate=interest_rate,
            tenure_months=request.tenure_months,
            payout_frequency=request.payout_frequency,
            maturity_amount=maturity_amount,
            maturity_date=maturity_date,
            status="ACTIVE",
            created_at=now,
            updated_at=now,
        )
        db.add(fd)

        # Create Transaction Ledger entry (DEBIT)
        ledger_entry = TransactionLedger(
            id=str(uuid.uuid4()),
            account_id=source_acc.id,
            transaction_type="DEBIT",
            amount=round(request.deposit_amount, 2),
            balance_after=source_acc.balance,
            reference_id=fd_id,
            description=f"Fixed Deposit Booking - {fd_acc_no}",
            created_at=now,
        )
        db.add(ledger_entry)

        # Create Receipt entry
        receipt_no = f"REC-FD-{now.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        receipt = FDAdviceReceipt(
            id=str(uuid.uuid4()),
            fd_id=fd_id,
            receipt_number=receipt_no,
            storage_path=f"/api/v1/fixed-deposits/{fd_id}/receipt",
            generated_at=now,
        )
        db.add(receipt)

        response_obj = FDCreateResponse(
            status="SUCCESS",
            message="Fixed Deposit account opened successfully.",
            fixed_deposit=FDAccountSummary(
                id=fd.id,
                fd_account_number=fd.fd_account_number,
                source_account_id=fd.source_account_id,
                deposit_amount=fd.deposit_amount,
                interest_rate=fd.interest_rate,
                tenure_months=fd.tenure_months,
                payout_frequency=fd.payout_frequency,
                maturity_amount=fd.maturity_amount,
                maturity_date=fd.maturity_date.strftime("%Y-%m-%d"),
                status=fd.status,
                created_at=fd.created_at.isoformat() + "Z",
            ),
            receipt=FDReceiptSummary(
                receipt_number=receipt.receipt_number,
                download_url=f"/api/v1/fixed-deposits/{fd.id}/receipt",
            ),
        )

        # Record Idempotency
        if idempotency_key:
            idempotency_record = IdempotencyRecord(
                idempotency_key=idempotency_key,
                customer_id=source_acc.customer_id,
                request_hash=request_hash,
                response_status=201,
                response_body=response_obj.model_dump_json(),
                created_at=now,
            )
            db.add(idempotency_record)

        db.commit()
        return response_obj

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failure during fixed deposit provisioning: {str(e)}",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during account creation: {str(e)}",
        )
