import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import (
    Account,
    ChipDefinition,
    InventoryBatch,
    AccountBalance,
    Transaction,
)
from server.schemas import (
    AllocateRequest,
    TransferRequest,
    RedeemRequest,
    AdjustRequest,
)
from server.services.audit_service import create_audit_log


def allocate_chips(db: Session, req: AllocateRequest) -> Transaction:
    account = (
        db.query(Account)
        .filter(Account.id == req.target_account_id)
        .with_for_update()
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Target account not found")

    chip = db.query(ChipDefinition).filter(ChipDefinition.id == req.chip_id).first()
    if not chip:
        raise HTTPException(status_code=404, detail="Chip definition not found")

    batches = (
        db.query(InventoryBatch)
        .filter(
            InventoryBatch.chip_id == req.chip_id, InventoryBatch.status == "active"
        )
        .with_for_update()
        .all()
    )

    total_available = sum(b.available_quantity for b in batches)
    if total_available < req.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient inventory stock. Available: {total_available}, Requested: {req.amount}",
        )

    remaining_to_deduct = req.amount
    for batch in batches:
        if remaining_to_deduct <= 0:
            break
        deduct = min(batch.available_quantity, remaining_to_deduct)
        batch.available_quantity -= deduct
        batch.allocated_quantity += deduct
        remaining_to_deduct -= deduct

    balance = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == req.target_account_id,
            AccountBalance.chip_id == req.chip_id,
        )
        .with_for_update()
        .first()
    )

    before_bal = balance.balance if balance else 0
    if balance:
        balance.balance += req.amount
    else:
        balance = AccountBalance(
            id=str(uuid.uuid4()),
            account_id=req.target_account_id,
            chip_id=req.chip_id,
            balance=req.amount,
        )
        db.add(balance)

    txn = Transaction(
        id=str(uuid.uuid4()),
        transaction_type="allocate",
        source_account_id=None,
        destination_account_id=req.target_account_id,
        chip_id=req.chip_id,
        amount=req.amount,
        status="completed",
        reason=req.reason,
    )
    db.add(txn)
    db.flush()

    create_audit_log(
        db,
        action_type="CHIP_ALLOCATE",
        entity_name="AccountBalance",
        entity_id=balance.id,
        actor_id=req.actor_id,
        before_state={"balance": before_bal},
        after_state={"balance": balance.balance, "allocated_amount": req.amount},
    )

    db.commit()
    db.refresh(txn)
    return txn


def transfer_chips(db: Session, req: TransferRequest) -> Transaction:
    if req.source_account_id == req.destination_account_id:
        raise HTTPException(
            status_code=400, detail="Source and destination accounts must be different"
        )

    source = (
        db.query(Account)
        .filter(Account.id == req.source_account_id)
        .with_for_update()
        .first()
    )
    dest = (
        db.query(Account)
        .filter(Account.id == req.destination_account_id)
        .with_for_update()
        .first()
    )

    if not source:
        raise HTTPException(status_code=404, detail="Source account not found")
    if not dest:
        raise HTTPException(status_code=404, detail="Destination account not found")

    source_bal = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == req.source_account_id,
            AccountBalance.chip_id == req.chip_id,
        )
        .with_for_update()
        .first()
    )

    if not source_bal or source_bal.balance < req.amount:
        avail = source_bal.balance if source_bal else 0
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient chip balance in source account. Available: {avail}, Requested: {req.amount}",
        )

    dest_bal = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == req.destination_account_id,
            AccountBalance.chip_id == req.chip_id,
        )
        .with_for_update()
        .first()
    )

    source_before = source_bal.balance
    dest_before = dest_bal.balance if dest_bal else 0

    source_bal.balance -= req.amount
    if dest_bal:
        dest_bal.balance += req.amount
    else:
        dest_bal = AccountBalance(
            id=str(uuid.uuid4()),
            account_id=req.destination_account_id,
            chip_id=req.chip_id,
            balance=req.amount,
        )
        db.add(dest_bal)

    txn = Transaction(
        id=str(uuid.uuid4()),
        transaction_type="transfer",
        source_account_id=req.source_account_id,
        destination_account_id=req.destination_account_id,
        chip_id=req.chip_id,
        amount=req.amount,
        status="completed",
        reason=req.reason,
    )
    db.add(txn)
    db.flush()

    create_audit_log(
        db,
        action_type="CHIP_TRANSFER",
        entity_name="Transaction",
        entity_id=txn.id,
        actor_id=req.actor_id,
        before_state={"source_balance": source_before, "dest_balance": dest_before},
        after_state={
            "source_balance": source_bal.balance,
            "dest_balance": dest_bal.balance,
            "transferred_amount": req.amount,
        },
    )

    db.commit()
    db.refresh(txn)
    return txn


def redeem_chips(db: Session, req: RedeemRequest) -> Transaction:
    account = (
        db.query(Account).filter(Account.id == req.account_id).with_for_update().first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    balance = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == req.account_id,
            AccountBalance.chip_id == req.chip_id,
        )
        .with_for_update()
        .first()
    )

    if not balance or balance.balance < req.amount:
        avail = balance.balance if balance else 0
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient chip balance for redemption. Available: {avail}, Requested: {req.amount}",
        )

    before_bal = balance.balance
    balance.balance -= req.amount

    txn = Transaction(
        id=str(uuid.uuid4()),
        transaction_type="redeem",
        source_account_id=req.account_id,
        destination_account_id=None,
        chip_id=req.chip_id,
        amount=req.amount,
        status="completed",
        reason=req.reason,
    )
    db.add(txn)
    db.flush()

    create_audit_log(
        db,
        action_type="CHIP_REDEEM",
        entity_name="AccountBalance",
        entity_id=balance.id,
        actor_id=req.actor_id,
        before_state={"balance": before_bal},
        after_state={"balance": balance.balance, "redeemed_amount": req.amount},
    )

    db.commit()
    db.refresh(txn)
    return txn


def adjust_chips(db: Session, req: AdjustRequest) -> Transaction:
    account = (
        db.query(Account).filter(Account.id == req.account_id).with_for_update().first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    balance = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == req.account_id,
            AccountBalance.chip_id == req.chip_id,
        )
        .with_for_update()
        .first()
    )

    before_bal = balance.balance if balance else 0
    new_bal = before_bal + req.amount
    if new_bal < 0:
        raise HTTPException(
            status_code=400, detail="Adjustment results in negative balance"
        )

    if balance:
        balance.balance = new_bal
    else:
        balance = AccountBalance(
            id=str(uuid.uuid4()),
            account_id=req.account_id,
            chip_id=req.chip_id,
            balance=new_bal,
        )
        db.add(balance)

    txn = Transaction(
        id=str(uuid.uuid4()),
        transaction_type="adjustment",
        source_account_id=req.account_id,
        destination_account_id=req.account_id,
        chip_id=req.chip_id,
        amount=req.amount,
        status="completed",
        reason=req.reason,
    )
    db.add(txn)
    db.flush()

    create_audit_log(
        db,
        action_type="CHIP_ADJUSTMENT",
        entity_name="AccountBalance",
        entity_id=balance.id,
        actor_id=req.actor_id,
        before_state={"balance": before_bal},
        after_state={"balance": balance.balance, "adjusted_amount": req.amount},
    )

    db.commit()
    db.refresh(txn)
    return txn
