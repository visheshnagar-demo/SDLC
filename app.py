"""Auto-Boot Cloud Run Server for sales_orders ETL Pipeline.
Listens on port 8080 and automatically executes the one-time ETL task on container boot.
"""
import os
import sys
import json
import logging
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sales_orders_server")

PORT = int(os.environ.get("PORT", 8080))
EXECUTION_STATUS = {
    "service": "sales_orders",
    "status": "INITIALIZING",
    "records_processed": 0,
    "last_run": None,
    "error": None,
}

def _run_pipeline_task():
    global EXECUTION_STATUS
    logger.info("Auto-Boot: Triggering one-time ETL execution for sales_orders...")
    try:
        from pipeline.run_sales_orders import PipelineRunner
        runner = PipelineRunner()
        records = runner.extract()
        if records > 0:
            runner.load()
        from datetime import datetime, timezone
        EXECUTION_STATUS["status"] = "SUCCESS"
        EXECUTION_STATUS["records_processed"] = records
        EXECUTION_STATUS["last_run"] = datetime.now(timezone.utc).isoformat()
        EXECUTION_STATUS["error"] = None
        logger.info("Auto-Boot: One-time ETL task completed successfully (records=%s).", records)
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
    logger.info("Serving sales_orders auto-boot HTTP server on port %d...", PORT)
    server.serve_forever()

if __name__ == "__main__":
    main()
