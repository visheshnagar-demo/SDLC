import calendar
from datetime import date
from typing import Optional, Tuple


def calculate_expiration(
    start_date: date,
    duration_months: int,
    coverage_type: str = "Standard",
) -> Tuple[Optional[date], str]:
    """
    Computes expiration date and warranty status.
    - If duration_months == 0 or coverage_type is 'Lifetime', returns (None, 'Lifetime')
    - Otherwise calculates expiration date = start_date + duration_months
    - Sets status to 'Active' or 'Expired' based on today's date
    """
    if duration_months == 0 or coverage_type.lower() == "lifetime":
        return None, "Lifetime"

    # Calculate month addition cleanly
    total_months = start_date.month - 1 + duration_months
    year = start_date.year + total_months // 12
    month = (total_months % 12) + 1
    max_day = calendar.monthrange(year, month)[1]
    day = min(start_date.day, max_day)
    expiration_date = date(year, month, day)

    today = date.today()
    if today > expiration_date:
        status = "Expired"
    else:
        status = "Active"

    return expiration_date, status


def is_expiring_soon(
    expiration_date: Optional[date],
    status: str,
    window_days: int = 30,
) -> Tuple[bool, int]:
    """
    Checks if a warranty is expiring within the specified window (default 30 days).
    Lifetime warranties and already expired warranties return False.
    """
    if expiration_date is None or status.lower() in ["lifetime", "expired", "void"]:
        return False, -1

    today = date.today()
    days_remaining = (expiration_date - today).days

    if 0 <= days_remaining <= window_days:
        return True, days_remaining

    return False, days_remaining
