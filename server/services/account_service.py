from typing import Optional
from sqlalchemy.orm import Session
from server.models import SavingsAccount, Customer
from server.schemas import SavingsAccountResponse, SavingsAccountListResponse

MIN_DEPOSIT_THRESHOLD = 500.00


def get_savings_accounts(
    db: Session,
    customer_id: Optional[str] = None,
    customer_email: Optional[str] = None,
) -> SavingsAccountListResponse:
    query = db.query(SavingsAccount)

    if customer_id:
        query = query.filter(SavingsAccount.customer_id == customer_id)
    elif customer_email:
        customer = db.query(Customer).filter(Customer.email == customer_email).first()
        if customer:
            query = query.filter(SavingsAccount.customer_id == customer.id)
    else:
        # If neither specified, fetch accounts for default test customer
        customer = db.query(Customer).filter(Customer.email == "test@example.com").first()
        if customer:
            query = query.filter(SavingsAccount.customer_id == customer.id)

    accounts = query.order_by(SavingsAccount.created_at.asc()).all()

    account_responses: list[SavingsAccountResponse] = []
    for acc in accounts:
        is_eligible = True
        ineligibility_reason: Optional[str] = None

        if acc.status.upper() != "ACTIVE":
            is_eligible = False
            ineligibility_reason = f"Account status is {acc.status} (inactive)"
        elif acc.balance < MIN_DEPOSIT_THRESHOLD:
            is_eligible = False
            ineligibility_reason = "Insufficient balance (< $500.00 minimum deposit)"

        account_responses.append(
            SavingsAccountResponse(
                id=acc.id,
                account_number=acc.account_number,
                account_type=acc.account_type,
                currency=acc.currency,
                available_balance=round(acc.balance, 2),
                status=acc.status,
                is_eligible_for_fd=is_eligible,
                ineligibility_reason=ineligibility_reason,
            )
        )

    return SavingsAccountListResponse(accounts=account_responses)
