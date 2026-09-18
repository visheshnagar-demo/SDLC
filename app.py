"""Auto-Boot Cloud Run Server for gcs_to_bigquery_viswa ETL Pipeline.
Listens on port 8080 and automatically executes the one-time ETL task on container boot.
"""
import os
import sys
import json
import logging
import threading
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gcs_to_bigquery_viswa_server")

PORT = int(os.environ.get("PORT", 8080))
EXECUTION_STATUS = {
    "service": "gcs_to_bigquery_viswa",
    "status": "INITIALIZING",
    "records_processed": 0,
    "last_run": None,
    "error": None,
    "metrics": {},
}

def _run_pipeline_task():
    global EXECUTION_STATUS
    logger.info("Auto-Boot: Triggering one-time ETL execution for gcs_to_bigquery_viswa...")
    try:
        from pipeline.run_gcs_to_bigquery_viswa import PipelineRunner
        runner = PipelineRunner()
        exit_code = runner.run()
        if exit_code == 0:
            EXECUTION_STATUS["status"] = "SUCCESS"
            EXECUTION_STATUS["records_processed"] = runner.metrics.get("rows_loaded", 0)
            EXECUTION_STATUS["metrics"] = runner.metrics
            EXECUTION_STATUS["last_run"] = datetime.now(timezone.utc).isoformat()
            EXECUTION_STATUS["error"] = None
            logger.info("Auto-Boot: One-time ETL task completed successfully (%s records).", EXECUTION_STATUS["records_processed"])
        else:
            EXECUTION_STATUS["status"] = "FAILED"
            EXECUTION_STATUS["error"] = "Pipeline exited with non-zero status"
            EXECUTION_STATUS["metrics"] = runner.metrics
            logger.error("Auto-Boot: One-time ETL task returned non-zero exit code.")
    except Exception as exc:
        logger.error("Auto-Boot: Pipeline execution error: %s", exc, exc_info=True)
        EXECUTION_STATUS["status"] = "FAILED"
        EXECUTION_STATUS["error"] = str(exc)

class PipelineStatusHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/", "/status", "/healthz"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(EXECUTION_STATUS, indent=2).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/run":
            threading.Thread(target=_run_pipeline_task, daemon=True).start()
            self.send_response(202)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"message": "ETL pipeline execution triggered"}, indent=2).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    threading.Thread(target=_run_pipeline_task, daemon=True).start()
    server = HTTPServer(("", PORT), PipelineStatusHandler)
    logger.info("Serving gcs_to_bigquery_viswa auto-boot HTTP server on port %d...", PORT)
    server.serve_forever()

if __name__ == "__main__":
    main()
