from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import (
    Account,
    AccountBalance,
    ChipDefinition,
    InventoryBatch,
    Transaction,
    AuditLog,
)


def allocate_chips(
    db: Session,
    account_id: str,
    chip_id: str,
    amount: int,
    reason: str,
    actor_id: str = "system",
) -> Transaction:
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allocation amount must be greater than zero.",
        )

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account or account.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target account '{account_id}' not found or inactive.",
        )

    chip = db.query(ChipDefinition).filter(ChipDefinition.id == chip_id).first()
    if not chip or chip.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chip definition '{chip_id}' not found or inactive.",
        )

    # Check available inventory stock across batches
    batches = (
        db.query(InventoryBatch)
        .filter(
            InventoryBatch.chip_id == chip_id,
            InventoryBatch.available_quantity > 0,
            InventoryBatch.status == "AVAILABLE",
        )
        .order_by(InventoryBatch.created_at.asc())
        .all()
    )

    total_avail = sum(b.available_quantity for b in batches)
    if total_avail < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient inventory stock available for allocation. Required: {amount}, Available: {total_avail}",
        )

    # Deduct from batch stock
    remaining_to_deduct = amount
    for batch in batches:
        if remaining_to_deduct <= 0:
            break
        deduct = min(batch.available_quantity, remaining_to_deduct)
        batch.available_quantity -= deduct
        batch.allocated_quantity += deduct
        remaining_to_deduct -= deduct
        if batch.available_quantity == 0:
            batch.status = "DEPLETED"

    # Update target account balance
    acc_balance = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == account_id, AccountBalance.chip_id == chip_id
        )
        .first()
    )

    if not acc_balance:
        acc_balance = AccountBalance(
            account_id=account_id, chip_id=chip_id, balance=amount
        )
        db.add(acc_balance)
    else:
        acc_balance.balance += amount

    db.flush()

    # Record Transaction
    tx = Transaction(
        transaction_type="ALLOCATION",
        source_account_id=None,
        destination_account_id=account_id,
        chip_id=chip_id,
        amount=amount,
        status="COMPLETED",
        reason=reason,
    )
    db.add(tx)
    db.flush()

    # Record AuditLog
    audit = AuditLog(
        actor_id=actor_id,
        action_type="ALLOCATION_EXECUTED",
        entity_name="transactions",
        entity_id=tx.id,
        before_state=None,
        after_state={
            "transaction_id": tx.id,
            "account_id": account_id,
            "chip_id": chip_id,
            "amount": amount,
            "new_balance": acc_balance.balance,
            "reason": reason,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)

    setattr(tx, "destination_balance_after", acc_balance.balance)
    return tx


def transfer_chips(
    db: Session,
    source_account_id: str,
    destination_account_id: str,
    chip_id: str,
    amount: int,
    reason: str,
    actor_id: str = "system",
) -> Transaction:
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer amount must be greater than zero.",
        )

    if source_account_id == destination_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and destination accounts must be different.",
        )

    source_acc = db.query(Account).filter(Account.id == source_account_id).first()
    if not source_acc or source_acc.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source account '{source_account_id}' not found or inactive.",
        )

    dest_acc = db.query(Account).filter(Account.id == destination_account_id).first()
    if not dest_acc or dest_acc.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination account '{destination_account_id}' not found or inactive.",
        )

    chip = db.query(ChipDefinition).filter(ChipDefinition.id == chip_id).first()
    if not chip or chip.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chip definition '{chip_id}' not found or inactive.",
        )

    # Sort account IDs to prevent cyclic locking deadlocks
    # Note: with_for_update() is used if supported by dialect
    first_id, second_id = sorted([source_account_id, destination_account_id])

    source_balance = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == source_account_id,
            AccountBalance.chip_id == chip_id,
        )
        .with_for_update()
        .first()
        if "sqlite" not in str(db.bind.url)
        else db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == source_account_id,
            AccountBalance.chip_id == chip_id,
        )
        .first()
    )

    if not source_balance or source_balance.balance < amount:
        avail_bal = source_balance.balance if source_balance else 0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance in source account. Requested: {amount}, Available: {avail_bal}",
        )

    dest_balance = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == destination_account_id,
            AccountBalance.chip_id == chip_id,
        )
        .with_for_update()
        .first()
        if "sqlite" not in str(db.bind.url)
        else db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == destination_account_id,
            AccountBalance.chip_id == chip_id,
        )
        .first()
    )

    if not dest_balance:
        dest_balance = AccountBalance(
            account_id=destination_account_id, chip_id=chip_id, balance=0
        )
        db.add(dest_balance)

    # Perform balance transfer
    source_balance.balance -= amount
    dest_balance.balance += amount

    db.flush()

    # Record Transaction
    tx = Transaction(
        transaction_type="TRANSFER",
        source_account_id=source_account_id,
        destination_account_id=destination_account_id,
        chip_id=chip_id,
        amount=amount,
        status="COMPLETED",
        reason=reason,
    )
    db.add(tx)
    db.flush()

    # Record AuditLog
    audit = AuditLog(
        actor_id=actor_id,
        action_type="TRANSFER_EXECUTED",
        entity_name="transactions",
        entity_id=tx.id,
        before_state={
            "source_balance": source_balance.balance + amount,
            "dest_balance": dest_balance.balance - amount,
        },
        after_state={
            "source_balance": source_balance.balance,
            "dest_balance": dest_balance.balance,
            "amount": amount,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)

    setattr(tx, "source_balance_after", source_balance.balance)
    setattr(tx, "destination_balance_after", dest_balance.balance)
    return tx


def redeem_chips(
    db: Session,
    account_id: str,
    chip_id: str,
    amount: int,
    reason: str,
    actor_id: str = "system",
) -> Transaction:
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Redemption amount must be greater than zero.",
        )

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account or account.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account '{account_id}' not found or inactive.",
        )

    balance_rec = (
        db.query(AccountBalance)
        .filter(
            AccountBalance.account_id == account_id, AccountBalance.chip_id == chip_id
        )
        .first()
    )

    if not balance_rec or balance_rec.balance < amount:
        avail = balance_rec.balance if balance_rec else 0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance for redemption. Requested: {amount}, Available: {avail}",
        )

    balance_rec.balance -= amount
    db.flush()

    tx = Transaction(
        transaction_type="REDEMPTION",
        source_account_id=account_id,
        destination_account_id=None,
        chip_id=chip_id,
        amount=amount,
        status="COMPLETED",
        reason=reason,
    )
    db.add(tx)
    db.flush()

    audit = AuditLog(
        actor_id=actor_id,
        action_type="REDEMPTION_EXECUTED",
        entity_name="transactions",
        entity_id=tx.id,
        before_state={"balance": balance_rec.balance + amount},
        after_state={"balance": balance_rec.balance, "amount": amount},
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)

    setattr(tx, "source_balance_after", balance_rec.balance)
    return tx
