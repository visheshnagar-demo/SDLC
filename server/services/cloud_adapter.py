"""Multi-cloud provider adapter simulation and operations."""

import uuid
import random
from typing import Dict, Any, Tuple


class CloudProviderAdapter:
    """Simulates provider SDK commands for AWS, GCP, Azure."""

    @staticmethod
    def provision_vm(
        provider_type: str, name: str, region: str, instance_type: str
    ) -> Tuple[str, str, str]:
        """
        Simulate provisioning a new instance.
        Returns: (external_instance_id, public_ip, private_ip)
        """
        uid_short = str(uuid.uuid4())[:8]
        if provider_type == "AWS":
            external_id = f"i-{uid_short}ab{random.randint(10, 99)}"
            public_ip = f"54.{random.randint(10, 250)}.{random.randint(1, 250)}.{random.randint(1, 250)}"
            private_ip = f"10.0.{random.randint(1, 10)}.{random.randint(2, 250)}"
        elif provider_type == "GCP":
            external_id = f"gcp-vm-{uid_short}"
            public_ip = f"34.{random.randint(10, 250)}.{random.randint(1, 250)}.{random.randint(1, 250)}"
            private_ip = f"10.128.{random.randint(1, 10)}.{random.randint(2, 250)}"
        elif provider_type == "AZURE":
            external_id = f"azure-vm-{uid_short}"
            public_ip = f"20.{random.randint(10, 250)}.{random.randint(1, 250)}.{random.randint(1, 250)}"
            private_ip = f"10.240.{random.randint(1, 10)}.{random.randint(2, 250)}"
        else:
            external_id = f"inst-{uid_short}"
            public_ip = f"198.51.{random.randint(1, 250)}.{random.randint(1, 250)}"
            private_ip = f"192.168.1.{random.randint(2, 250)}"

        return external_id, public_ip, private_ip

    @staticmethod
    def execute_action(action: str, current_status: str) -> Tuple[str, str]:
        """
        Calculates the state transition for an action.
        Returns: (new_status, message)
        """
        action_upper = action.upper()
        if action_upper == "START":
            return "RUNNING", "Instance started successfully"
        elif action_upper == "STOP":
            return "STOPPED", "Instance stopped successfully"
        elif action_upper == "RESTART":
            return "RUNNING", "Instance restarted successfully"
        elif action_upper == "TERMINATE":
            return "TERMINATED", "Instance terminated successfully"
        else:
            return current_status, f"Unknown action {action}"

    @staticmethod
    def generate_current_metrics(instance_id: str) -> Dict[str, Any]:
        """Generates realistic telemetry metrics for an instance."""
        return {
            "instance_id": instance_id,
            "cpu_utilization_pct": round(random.uniform(15.0, 85.0), 2),
            "memory_utilization_pct": round(random.uniform(30.0, 90.0), 2),
            "disk_read_bytes_sec": random.randint(512, 16384),
            "network_in_bytes_sec": random.randint(1024, 65536),
        }
