"""Main CLI entrypoint for the Cloud SQL PostgreSQL to BigQuery ETL service."""
import sys
import json
from server.config import get_config
from server.pipeline.orchestrator import PipelineOrchestrator
from server.utils.logger import get_logger

logger = get_logger("sdlc-etl-main")


def main() -> None:
    """Main execution entrypoint."""
    logger.info("Initializing SDLC Cloud SQL PostgreSQL to BigQuery ETL Job...")
    try:
        config = get_config()
        orchestrator = PipelineOrchestrator(config=config)
        metrics = orchestrator.run()
        print(json.dumps(metrics, indent=2))
    except Exception as exc:
        logger.critical("Fatal error during ETL execution: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
