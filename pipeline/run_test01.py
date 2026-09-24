"""Standalone Connector Pipeline: test01
Architecture: GCS -> Local Staging -> BIGQUERY
"""
import argparse
import logging
import sys

from server.main import main

if __name__ == "__main__":
    main()
