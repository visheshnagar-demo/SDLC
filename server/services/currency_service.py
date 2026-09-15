import json
import uuid
import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import ExchangeRateCache

DEFAULT_RATES = {
    "USD": 1.0,
    "EUR": 0.925,
    "GBP": 0.79,
    "JPY": 155.0,
    "CAD": 1.36,
}

SUPPORTED_CURRENCIES = set(DEFAULT_RATES.keys())


def get_now_utc() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


def get_cached_rates(db: Session, base_currency: str = "USD") -> dict[str, float]:
    base_currency = base_currency.upper()
    if base_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported currency '{base_currency}'. Supported currencies: {', '.join(sorted(SUPPORTED_CURRENCIES))}",
        )

    now = get_now_utc()
    cache = (
        db.query(ExchangeRateCache)
        .filter(ExchangeRateCache.base_currency == base_currency)
        .first()
    )

    if cache and cache.expires_at:
        expires_at = cache.expires_at
        if expires_at.tzinfo is not None:
            expires_at = expires_at.replace(tzinfo=None)
        if expires_at > now:
            try:
                return json.loads(cache.rates_json)
            except Exception:
                pass

    # Calculate rates relative to base_currency
    base_usd_rate = DEFAULT_RATES.get(base_currency, 1.0)
    calculated_rates = {
        curr: round(rate / base_usd_rate, 4) for curr, rate in DEFAULT_RATES.items()
    }

    rates_json = json.dumps(calculated_rates)
    expires_at = now + datetime.timedelta(minutes=15)

    if cache:
        cache.rates_json = rates_json
        cache.fetched_at = now
        cache.expires_at = expires_at
    else:
        cache = ExchangeRateCache(
            id=str(uuid.uuid4()),
            base_currency=base_currency,
            rates_json=rates_json,
            fetched_at=now,
            expires_at=expires_at,
        )
        db.add(cache)

    db.commit()
    return calculated_rates


def convert_currency(
    db: Session,
    amount: float,
    from_currency: str = "USD",
    to_currency: str = "USD",
) -> tuple[float, float]:
    from_curr = from_currency.upper()
    to_curr = to_currency.upper()

    if from_curr not in SUPPORTED_CURRENCIES or to_curr not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Currency '{to_curr}' is not supported. Supported: {', '.join(sorted(SUPPORTED_CURRENCIES))}",
        )

    rates = get_cached_rates(db, base_currency=from_curr)
    rate = rates.get(to_curr, 1.0)
    converted = round(amount * rate, 2)
    return converted, rate
