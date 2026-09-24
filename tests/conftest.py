"""Pytest configuration for ETL pipeline tests."""

import os
import sys

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)
else:
    sys.path.remove(workspace_root)
    sys.path.insert(0, workspace_root)

# Evict cached pipeline package
for mod in list(sys.modules.keys()):
    if mod == "pipeline" or mod.startswith("pipeline."):
        del sys.modules[mod]
