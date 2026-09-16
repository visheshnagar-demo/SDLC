import os
import pytest

# Ensure TESTING environment variable is set for test runs
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
