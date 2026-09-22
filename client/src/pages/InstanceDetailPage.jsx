import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Server,
  ArrowLeft,
  Activity,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import InstanceActionToolbar from "../components/instances/InstanceActionToolbar.jsx";
import TelemetryChart from "../components/telemetry/TelemetryChart.jsx";
import { instancesApi, metricsApi } from "../services/api.js";

export default function InstanceDetailPage({ currentUser }) {
  const { instanceId } = useParams();
  const [instance, setInstance] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [copiedText, setCopiedText] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchInstanceDetails = async () => {
    setActionError(null);
    try {
      const [instRes, metricsRes] = await Promise.allSettled([
        instancesApi.getInstance(instanceId),
        metricsApi.getInstanceMetrics(instanceId),
      ]);

      if (instRes.status === "fulfilled" && instRes.value) {
        setInstance(instRes.value);
      } else {
        // Fallback seed detail
        setInstance({
          id: instanceId || "inst-001",
          external_instance_id: "i-03ab92fc112",
          name: "web-server-01",
          provider_type: "AWS",
          provider_id: "AWS",
          region: "us-east-1",
          zone: "us-east-1a",
          instance_type: "t3.medium",
          status: "RUNNING",
          public_ip: "54.210.12.89",
          private_ip: "10.0.1.24",
          os_image: "Ubuntu 22.04 LTS (Jammy)",
          cpu_cores: 2,
          ram_gb: 4,
          disk_size_gb: 50,
          ssh_key: "cloudpulse-default-key",
          security_group: "sg-web-public-traffic",
          created_at: "2026-05-18T08:30:00Z",
        });
      }

      if (
        metricsRes.status === "fulfilled" &&
        Array.isArray(metricsRes.value)
      ) {
        setMetrics(metricsRes.value);
      } else {
        setMetrics([
          {
            timestamp: "10:00",
            cpu_utilization_pct: 22,
            memory_utilization_pct: 45,
            disk_read_bytes_sec: 1200,
            network_in_bytes_sec: 4500,
          },
          {
            timestamp: "10:15",
            cpu_utilization_pct: 48,
            memory_utilization_pct: 52,
            disk_read_bytes_sec: 3400,
            network_in_bytes_sec: 8900,
          },
          {
            timestamp: "10:30",
            cpu_utilization_pct: 65,
            memory_utilization_pct: 60,
            disk_read_bytes_sec: 5200,
            network_in_bytes_sec: 14200,
          },
          {
            timestamp: "10:45",
            cpu_utilization_pct: 78,
            memory_utilization_pct: 68,
            disk_read_bytes_sec: 4100,
            network_in_bytes_sec: 11000,
          },
          {
            timestamp: "11:00",
            cpu_utilization_pct: 54,
            memory_utilization_pct: 58,
            disk_read_bytes_sec: 2300,
            network_in_bytes_sec: 7600,
          },
        ]);
      }
    } catch {
      setActionError(
        "Could not connect to telemetry service for this instance.",
      );
    }
  };

  useEffect(() => {
    fetchInstanceDetails();
  }, [instanceId]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAction = async (action) => {
    if (currentUser?.role !== "ADMIN") {
      setActionError(
        "RBAC Violation: You must be an Administrator to alter VM state.",
      );
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      await instancesApi.executeAction(instance.id, action);
      setActionSuccess(`Command ${action} accepted by provider adapter.`);
      let newStatus = instance.status;
      if (action === "START") newStatus = "RUNNING";
      if (action === "STOP") newStatus = "STOPPED";
      if (action === "RESTART") newStatus = "RUNNING";
      if (action === "TERMINATE") newStatus = "TERMINATED";
      setInstance({ ...instance, status: newStatus });
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          `Failed to perform ${action} on this instance.`,
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Back Link */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs text-[#bcc9cd] hover:text-[#06b6d4] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Overview</span>
        </Link>
      </div>

      {/* Instance Header Title & Badges */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#06b6d4]/10 rounded-2xl border border-[#06b6d4]/30 text-[#06b6d4]">
              <Server className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold font-mono text-[#dae2fd]">
                  {instance?.name || "Loading instance..."}
                </h1>
                <span className="bg-[#171f33] text-[#bcc9cd] text-xs px-2.5 py-0.5 rounded font-mono border border-[#3d494c]">
                  {instance?.external_instance_id || instance?.id}
                </span>
                <span className="bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 px-2 py-0.5 rounded text-xs font-mono font-bold">
                  {instance?.provider_type || "AWS"}
                </span>
              </div>
              <p className="text-xs text-[#bcc9cd] mt-1 font-mono">
                {instance?.region || "us-east-1"} (
                {instance?.zone || "us-east-1a"}) •{" "}
                {instance?.instance_type || "t3.medium"} •{" "}
                {instance?.os_image || "Ubuntu 22.04 LTS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0b1326] px-3 py-2 rounded-xl border border-[#1e293b] text-right font-mono">
              <span className="text-[10px] text-[#64748b] block uppercase">
                Uptime / Launch
              </span>
              <span className="text-xs font-semibold text-[#10b981]">
                {instance?.status === "RUNNING"
                  ? "99.99% (Active)"
                  : "Offline / Standby"}
              </span>
            </div>
          </div>
        </div>

        {/* IP and Network Quick Copy Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1e293b] text-xs font-mono">
          <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#64748b] block">
                Public IPv4
              </span>
              <span className="text-[#dae2fd] font-bold">
                {instance?.public_ip || "—"}
              </span>
            </div>
            {instance?.public_ip && (
              <button
                onClick={() => handleCopy(instance.public_ip)}
                className="text-[#64748b] hover:text-[#06b6d4] p-1"
                title="Copy Public IP"
              >
                {copiedText === instance.public_ip ? (
                  <Check className="w-3.5 h-3.5 text-[#10b981]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#64748b] block">
                Private VPC IPv4
              </span>
              <span className="text-[#dae2fd] font-bold">
                {instance?.private_ip || "10.0.1.24"}
              </span>
            </div>
            <button
              onClick={() => handleCopy(instance?.private_ip || "10.0.1.24")}
              className="text-[#64748b] hover:text-[#06b6d4] p-1"
              title="Copy Private IP"
            >
              {copiedText === (instance?.private_ip || "10.0.1.24") ? (
                <Check className="w-3.5 h-3.5 text-[#10b981]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] block">Keypair</span>
            <span className="text-[#38bdf8] truncate block">
              {instance?.ssh_key || "cloudpulse-key"}
            </span>
          </div>

          <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] block">
              Security Group
            </span>
            <span className="text-[#06b6d4] truncate block">
              {instance?.security_group || "sg-web-traffic"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <InstanceActionToolbar
        instance={instance}
        currentUser={currentUser}
        onAction={handleAction}
        onRefresh={fetchInstanceDetails}
      />

      {/* Notification Banners */}
      {actionSuccess && (
        <div className="bg-[#10b981]/15 border border-[#10b981]/40 p-3.5 rounded-xl flex items-center gap-3 text-[#10b981] text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-[#f43f5e]/15 border border-[#f43f5e]/40 p-3.5 rounded-xl flex items-center justify-between text-[#f43f5e] text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-[#bcc9cd] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Telemetry Charts 2x2 Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#dae2fd] flex items-center gap-2 font-mono">
          <Activity className="w-4 h-4 text-[#06b6d4]" />
          Real-Time Multi-Cloud Telemetry & Performance
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TelemetryChart
            title="CPU Utilization %"
            metricKey="cpu_utilization_pct"
            unit="%"
            color="#06b6d4"
            threshold={85}
            data={metrics}
          />

          <TelemetryChart
            title="Memory RAM Usage %"
            metricKey="memory_utilization_pct"
            unit="%"
            color="#38bdf8"
            threshold={90}
            data={metrics}
          />

          <TelemetryChart
            title="Disk I/O Throughput"
            metricKey="disk_read_bytes_sec"
            unit=" KB/s"
            color="#10b981"
            threshold={8000}
            data={metrics}
          />

          <TelemetryChart
            title="Network Traffic Ingress / Egress"
            metricKey="network_in_bytes_sec"
            unit=" KB/s"
            color="#f59e0b"
            threshold={20000}
            data={metrics}
          />
        </div>
      </div>
    </div>
  );
}
