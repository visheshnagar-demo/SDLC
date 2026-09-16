# Server Package Init
import sys

sys.modules["pandas"] = None

try:
    import cryptography.hazmat.backends

    if not hasattr(cryptography.hazmat.backends, "default_backend"):
        cryptography.hazmat.backends.default_backend = lambda: None
except ImportError:
    pass
