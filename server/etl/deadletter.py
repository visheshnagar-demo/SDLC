"""Dead-Letter Router.
Captures corrupt or malformed records and routes them to BigQuery quarantine table.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class DeadLetterRouter:
    def __init__(self, project_id: str, dataset_id: str, table_id: str = "etl_deadletter_records"):
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.table_id = table_id
        self.full_table_id = f"{project_id}.{dataset_id}.{table_id}"

    def route_deadletter(self, deadletter_records: List[Dict[str, Any]]) -> bool:
        if not deadletter_records:
            logger.info("No deadletter records to route.")
            return True

        logger.warning(
            "Routing %d deadletter records to quarantine table %s",
            len(deadletter_records),
            self.full_table_id,
        )

        try:
            from google.cloud import bigquery
            client = bigquery.Client(project=self.project_id)
            errors = client.insert_rows_json(self.full_table_id, deadletter_records)
            if errors:
                logger.error("BigQuery insert errors for deadletter: %s", errors)
                return False
            logger.info("Successfully persisted deadletter records.")
            return True
        except Exception as exc:
            logger.warning("BigQuery client unavailable or failed (%s); logging deadletter locally.", exc)
            for rec in deadletter_records:
                logger.error("DeadLetter Record: %s", rec)
            return True
