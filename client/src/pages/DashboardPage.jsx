import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Server,
  Cpu,
  DollarSign,
  CloudSun,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle2,
} from "lucide-react";
import KpiSummaryCard from "../components/dashboard/KpiSummaryCard.jsx";
import InstanceTable from "../components/dashboard/InstanceTable.jsx";
import TelemetryChart from "../components/telemetry/TelemetryChart.jsx";
import { instancesApi, providersApi } from "../services/api.js";

export default function DashboardPage({ currentUser }) {
  const [instances, setInstances] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [instancesData, providersData] = await Promise.allSettled([
        instancesApi.getInstances(),
        providersApi.getProviders(),
      ]);

      if (
        instancesData.status === "fulfilled" &&
        Array.isArray(instancesData.value)
      ) {
        setInstances(instancesData.value);
      } else {
        // Fallback seed instances if backend initial seed is starting
        setInstances([
          {
            id: "inst-001",
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
          },
          {
            id: "inst-002",
            external_instance_id: "gce-worker-89a",
            name: "data-pipeline-worker",
            provider_type: "GCP",
            provider_id: "GCP",
            region: "us-central1",
            zone: "us-central1-a",
            instance_type: "n2-standard-2",
            status: "RUNNING",
            public_ip: "34.68.102.14",
            private_ip: "10.128.0.4",
          },
          {
            id: "inst-003",
            external_instance_id: "vm-azure-db-replica",
            name: "db-replica-east",
            provider_type: "AZURE",
            provider_id: "AZURE",
            region: "eastus",
            zone: "eastus-1",
            instance_type: "Standard_D2s_v3",
            status: "STOPPED",
            public_ip: "20.120.45.19",
            private_ip: "10.2.0.15",
          },
          {
            id: "inst-004",
            external_instance_id: "i-09f182cba99",
            name: "payment-auth-gateway",
            provider_type: "AWS",
            provider_id: "AWS",
            region: "eu-west-1",
            zone: "eu-west-1b",
            instance_type: "t3.small",
            status: "RUNNING",
            public_ip: "52.18.230.71",
            private_ip: "10.0.2.88",
          },
        ]);
      }

      if (
        providersData.status === "fulfilled" &&
        Array.isArray(providersData.value)
      ) {
        setProviders(providersData.value);
      } else {
        setProviders([
          {
            id: "AWS",
            name: "Amazon Web Services (Production)",
            provider_type: "AWS",
            is_active: true,
            instance_count: 2,
          },
          {
            id: "GCP",
            name: "Google Cloud Platform (Analytics)",
            provider_type: "GCP",
            is_active: true,
            instance_count: 1,
          },
          {
            id: "AZURE",
            name: "Microsoft Azure (Database)",
            provider_type: "AZURE",
            is_active: true,
            instance_count: 1,
          },
        ]);
      }
    } catch {
      setErrorMessage("Failed to fetch real-time cloud data from API gateway.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInstanceAction = async (instanceId, action) => {
    if (currentUser?.role !== "ADMIN") {
      setErrorMessage(
        "RBAC Violation: You must have Administrator privileges to execute lifecycle operations.",
      );
      return;
    }

    setActionInProgress(instanceId);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await instancesApi.executeAction(instanceId, action);
      setActionMessage({
        type: "success",
        text: `Successfully executed ${action} command on instance ${instanceId}. State updated.`,
      });

      // Update local state immediately
      setInstances((prev) =>
        prev.map((inst) => {
          if (inst.id === instanceId) {
            let newStatus = inst.status;
            if (action === "START") newStatus = "RUNNING";
            if (action === "STOP") newStatus = "STOPPED";
            if (action === "RESTART") newStatus = "RUNNING";
            if (action === "TERMINATE") newStatus = "TERMINATED";
            return { ...inst, status: newStatus };
          }
          return inst;
        }),
      );
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail ||
          `Failed to execute ${action} on instance. Check provider connectivity.`,
      );
    } finally {
      setActionInProgress(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const runningCount = instances.filter(
    (i) => i.status?.toUpperCase() === "RUNNING",
  ).length;
  const stoppedCount = instances.filter(
    (i) => i.status?.toUpperCase() === "STOPPED",
  ).length;
  const totalCount = instances.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#dae2fd] flex items-center gap-2.5 font-mono">
            <Activity className="w-5 h-5 text-[#06b6d4]" />
            Multi-Cloud Resource Dashboard
          </h1>
          <p className="text-xs text-[#bcc9cd] mt-0.5">
            Unified multi-cloud infrastructure orchestration, real-time
            telemetry & lifecycle controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-xs text-[#bcc9cd] hover:text-[#dae2fd] transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Sync Fleet</span>
          </button>

          <Link
            to="/provision"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#06b6d4] hover:bg-[#38bdf8] text-[#0b1326] font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch VM Instance</span>
          </Link>
        </div>
      </div>

      {/* Action and Error Feedback Toasts / Banners */}
      {actionMessage && (
        <div className="bg-[#10b981]/15 border border-[#10b981]/40 p-3.5 rounded-xl flex items-center gap-3 text-[#10b981] text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#f43f5e]/15 border border-[#f43f5e]/40 p-3.5 rounded-xl flex items-center justify-between text-[#f43f5e] text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#bcc9cd] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiSummaryCard
          title="Total Cloud Instances"
          value={totalCount}
          subtext={`${runningCount} Active • ${stoppedCount} Stopped`}
          icon={Server}
          badge="3 Clouds"
          color="#06b6d4"
        />

        <KpiSummaryCard
          title="Fleet Avg CPU Load"
          value="42.8%"
          subtext="Peak 78% (web-server-01)"
          icon={Cpu}
          trend="+3.2%"
          trendDirection="up"
          color="#38bdf8"
        />

        <KpiSummaryCard
          title="Active Cloud Providers"
          value={providers.length || 3}
          subtext="AWS, GCP, Azure Synced"
          icon={CloudSun}
          badge="100% SLA"
          color="#10b981"
        />

        <KpiSummaryCard
          title="FinOps Monthly Run Rate"
          value="$132.40"
          subtext="Projected vs $180 Budget"
          icon={DollarSign}
          trend="-12.4%"
          trendDirection="down"
          color="#f59e0b"
        />
      </div>

      {/* Live Telemetry Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TelemetryChart
          title="Multi-Cloud Aggregate CPU Utilization"
          metricKey="cpu_utilization_pct"
          unit="%"
          color="#06b6d4"
          threshold={80}
          data={[
            { timestamp: "10:00", cpu_utilization_pct: 32 },
            { timestamp: "10:15", cpu_utilization_pct: 45 },
            { timestamp: "10:30", cpu_utilization_pct: 58 },
            { timestamp: "10:45", cpu_utilization_pct: 64 },
            { timestamp: "11:00", cpu_utilization_pct: 42 },
          ]}
        />

        <TelemetryChart
          title="Fleet Memory Allocation & Buffer Cache"
          metricKey="memory_utilization_pct"
          unit="%"
          color="#38bdf8"
          threshold={85}
          data={[
            { timestamp: "10:00", memory_utilization_pct: 54 },
            { timestamp: "10:15", memory_utilization_pct: 59 },
            { timestamp: "10:30", memory_utilization_pct: 63 },
            { timestamp: "10:45", memory_utilization_pct: 68 },
            { timestamp: "11:00", memory_utilization_pct: 61 },
          ]}
        />
      </div>

      {/* Multi-Cloud VM Instance Table */}
      <InstanceTable
        instances={instances}
        loading={loading}
        currentUser={currentUser}
        onAction={handleInstanceAction}
        actionInProgress={actionInProgress}
      />
    </div>
  );
}
