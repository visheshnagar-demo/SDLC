"""Runner script for postgres_to_bigquery Cloud Run Job execution."""
import sys
from server.etl.pipeline import main

if __name__ == "__main__":
    sys.exit(main())
