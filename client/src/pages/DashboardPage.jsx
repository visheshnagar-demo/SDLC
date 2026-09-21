import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import MetricSummaryCard from "../components/MetricSummaryCard";
import ApiEndpointTable from "../components/ApiEndpointTable";
import ApiRegistrationModal from "../components/ApiRegistrationModal";
import {
  getDashboardSummary,
  listApis,
  registerApi,
  updateApi,
  deleteApi,
  triggerApiCheck,
} from "../services/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [apis, setApis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiToEdit, setApiToEdit] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setError(null);
    try {
      const [summaryRes, apisRes] = await Promise.all([
        getDashboardSummary(),
        listApis(0, 100),
      ]);
      setSummary(summaryRes);
      setApis(apisRes || []);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load telemetry data.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleOpenRegister = () => {
    setApiToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (api) => {
    setApiToEdit(api);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setApiToEdit(null);
  };

  const handleModalSubmit = async (payload) => {
    setIsSaving(true);
    try {
      if (apiToEdit) {
        await updateApi(apiToEdit.id, payload);
        setActionNotice({
          type: "success",
          message: `API '${payload.name}' updated successfully.`,
        });
      } else {
        await registerApi(payload);
        setActionNotice({
          type: "success",
          message: `API '${payload.name}' registered for monitoring.`,
        });
      }
      handleCloseModal();
      await fetchData();
    } finally {
      setIsSaving(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleDelete = async (apiId) => {
    const apiToDelete = apis.find((a) => a.id === apiId);
    if (
      !window.confirm(
        `Are you sure you want to delete '${apiToDelete?.name || apiId}' and its historical logs?`,
      )
    ) {
      return;
    }

    try {
      await deleteApi(apiId);
      setActionNotice({ type: "success", message: "API endpoint deleted." });
      await fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to delete API.";
      setActionNotice({
        type: "error",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleTriggerCheck = async (apiId) => {
    try {
      const result = await triggerApiCheck(apiId);
      setActionNotice({
        type: result.is_success ? "success" : "error",
        message: `Probe executed: ${result.operational_status} (${result.latency_ms?.toFixed(1)}ms)`,
      });
      await fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Health probe failed.";
      setActionNotice({
        type: "error",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const activeFailures = summary?.active_failures || 0;

  return (
    <DashboardLayout
      onOpenRegisterModal={handleOpenRegister}
      onRefresh={() => fetchData(true)}
      isRefreshing={isRefreshing}
      systemStatus={activeFailures > 0 ? "Degraded" : "Operational"}
      activeFailuresCount={activeFailures}
    >
      <div className="space-y-6">
        {/* Action / Notification Banner */}
        {actionNotice && (
          <div
            role="alert"
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
              actionNotice.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              {actionNotice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{actionNotice.message}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              &times;
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded text-rose-200 font-medium transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Outage Alert Banner */}
        {activeFailures > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-bold">CRITICAL OUTAGE DETECTED:</span>{" "}
                <span>
                  {activeFailures} monitored API
                  {activeFailures > 1 ? "s are" : " is"} currently down or
                  failing health checks.
                </span>
              </div>
            </div>
            <Link
              to="/failures"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-semibold text-xs rounded-lg shadow-md transition self-start sm:self-auto"
            >
              <span>Inspect Failure Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <MetricSummaryCard
            title="Total Monitored APIs"
            value={summary ? summary.total_apis : "--"}
            subtext={`${summary?.active_apis || 0} active in rotation`}
            icon={Globe}
            variant="default"
          />

          <MetricSummaryCard
            title="Overall Uptime (24h)"
            value={summary ? `${summary.overall_uptime_pct}%` : "--"}
            subtext={`${summary?.total_checks_24h || 0} checks completed`}
            icon={CheckCircle2}
            variant={
              summary?.overall_uptime_pct >= 99
                ? "success"
                : summary?.overall_uptime_pct >= 90
                  ? "warning"
                  : "danger"
            }
          />

          <MetricSummaryCard
            title="Average Latency"
            value={summary ? summary.average_latency_ms : "--"}
            unit="ms"
            subtext="Calculated across active probes"
            icon={Clock}
            variant={
              summary?.average_latency_ms > 1000
                ? "danger"
                : summary?.average_latency_ms > 300
                  ? "warning"
                  : "default"
            }
          />

          <MetricSummaryCard
            title="Active Failures"
            value={summary ? summary.active_failures : "--"}
            subtext={`${summary?.failure_checks_24h || 0} failures in 24h`}
            icon={XCircle}
            variant={summary?.active_failures > 0 ? "danger" : "success"}
          />
        </div>

        {/* Monitored APIs Table */}
        <ApiEndpointTable
          apis={apis}
          onTriggerCheck={handleTriggerCheck}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onOpenRegister={handleOpenRegister}
          isProbing={isRefreshing}
        />
      </div>

      {/* Registration / Edit Modal */}
      <ApiRegistrationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        initialData={apiToEdit}
        isLoading={isSaving}
      />
    </DashboardLayout>
  );
}
