import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from server.models.health_log_model import HealthLogModel
from server.database import SessionLocal
from server.config import LOG_RETENTION_DAYS

logger = logging.getLogger(__name__)


def purge_expired_logs(db: Session, retention_days: int = LOG_RETENTION_DAYS) -> int:
    """Purge health log records older than the configured retention threshold (default: 30 days)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    deleted_count = (
        db.query(HealthLogModel)
        .filter(HealthLogModel.checked_at < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()
    logger.info(
        f"Retention Purge: Removed {deleted_count} logs older than {retention_days} days."
    )
    return deleted_count


async def start_background_retention_worker(interval_seconds: int = 86400) -> None:
    """Daily background worker to purge old health logs."""
    logger.info("Starting background log retention cleanup worker...")
    while True:
        try:
            db = SessionLocal()
            try:
                purge_expired_logs(db, LOG_RETENTION_DAYS)
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("Log retention worker cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in log retention cleanup: {e}")
        await asyncio.sleep(interval_seconds)
