import datetime
from typing import Optional
from sqlalchemy.orm import Session
from server.models import FixedDepositPlan
from server.schemas import FDRatePlan, FDProjection, FDRatesResponse

DEFAULT_PLANS = [
    {"tenure_months": 6, "interest_rate": 4.75, "min_deposit": 500.00},
    {"tenure_months": 12, "interest_rate": 5.50, "min_deposit": 500.00},
    {"tenure_months": 24, "interest_rate": 5.80, "min_deposit": 500.00},
    {"tenure_months": 36, "interest_rate": 6.00, "min_deposit": 500.00},
]


def calculate_projection(
    deposit_amount: float,
    tenure_months: int,
    interest_rate: float,
    payout_frequency: str = "AT_MATURITY",
) -> FDProjection:
    # Simple annual compounding interest calculation
    total_interest = round(deposit_amount * (interest_rate / 100.0) * (tenure_months / 12.0), 2)
    maturity_amount = round(deposit_amount + total_interest, 2)

    # Approximate maturity date
    now = datetime.datetime.now(datetime.timezone.utc)
    # Add roughly tenure_months * 30.4375 days
    maturity_dt = now + datetime.timedelta(days=int(tenure_months * 30.4375))
    maturity_date_str = maturity_dt.strftime("%Y-%m-%d")

    return FDProjection(
        deposit_amount=round(deposit_amount, 2),
        tenure_months=tenure_months,
        interest_rate=interest_rate,
        payout_frequency=payout_frequency,
        total_interest_earned=total_interest,
        maturity_amount=maturity_amount,
        maturity_date=maturity_date_str,
    )


def get_fd_rates_and_projection(
    db: Session,
    deposit_amount: Optional[float] = None,
    tenure_months: Optional[int] = None,
    payout_frequency: str = "AT_MATURITY",
) -> FDRatesResponse:
    db_plans = (
        db.query(FixedDepositPlan)
        .filter(FixedDepositPlan.is_active == True)  # noqa: E712
        .order_by(FixedDepositPlan.tenure_months.asc())
        .all()
    )

    plans_list: list[FDRatePlan] = []
    if db_plans:
        for p in db_plans:
            plans_list.append(
                FDRatePlan(
                    tenure_months=p.tenure_months,
                    interest_rate=p.interest_rate,
                    min_deposit=p.min_deposit_amount,
                )
            )
    else:
        for p in DEFAULT_PLANS:
            plans_list.append(FDRatePlan(**p))

    calculation: Optional[FDProjection] = None
    if deposit_amount is not None and tenure_months is not None:
        # Match rate
        matched_plan = next(
            (p for p in plans_list if p.tenure_months == tenure_months),
            None,
        )
        if matched_plan:
            rate = matched_plan.interest_rate
        else:
            # fallback rate based on tenure
            rate = 5.0
        calculation = calculate_projection(
            deposit_amount=deposit_amount,
            tenure_months=tenure_months,
            interest_rate=rate,
            payout_frequency=payout_frequency,
        )

    return FDRatesResponse(plans=plans_list, calculation=calculation)
