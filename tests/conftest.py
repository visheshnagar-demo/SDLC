import os
import sys

sys.modules["pandas"] = None

try:
    import cryptography.hazmat.backends

    if not hasattr(cryptography.hazmat.backends, "default_backend"):
        cryptography.hazmat.backends.default_backend = lambda: None
except ImportError:
    pass

# Ensure TESTING environment variable is set for test runs
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
