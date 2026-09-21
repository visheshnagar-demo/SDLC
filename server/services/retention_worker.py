import datetime
from sqlalchemy.orm import Session
from server.models.health_log_model import HealthLog


class RetentionWorker:
    @staticmethod
    def purge_old_logs(db: Session, days: int = 30) -> int:
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        cutoff = now - datetime.timedelta(days=days)

        deleted_count = (
            db.query(HealthLog)
            .filter(HealthLog.checked_at < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        return deleted_count


retention_worker = RetentionWorker()
