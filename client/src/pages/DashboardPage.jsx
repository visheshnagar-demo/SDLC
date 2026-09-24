import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { StatMetricCard } from "../components/StatMetricCard";
import { MonitorsTable } from "../components/MonitorsTable";
import { RegisterApiModal } from "../components/RegisterApiModal";
import {
  getMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  triggerHealthCheck,
  getMetrics,
} from "../services/api";
import {
  Activity,
  Server,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
  X,
} from "lucide-react";

export const DashboardPage = () => {
  const [monitors, setMonitors] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Probe execution state
  const [runningCheckId, setRunningCheckId] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const [monitorsRes, metricsRes] = await Promise.allSettled([
        getMonitors(),
        getMetrics({ time_window: "24h" }),
      ]);

      if (monitorsRes.status === "fulfilled") {
        setMonitors(
          Array.isArray(monitorsRes.value)
            ? monitorsRes.value
            : monitorsRes.value?.items || [],
        );
      } else {
        throw monitorsRes.reason;
      }

      if (metricsRes.status === "fulfilled") {
        setMetrics(metricsRes.value);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to connect to Health Monitoring service.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(false);
  };

  const handleCreateOrUpdateMonitor = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingMonitor) {
        await updateMonitor(editingMonitor.id, formData);
        setFeedbackToast({
          type: "success",
          message: `Monitor "${formData.name}" updated successfully.`,
        });
      } else {
        await createMonitor(formData);
        setFeedbackToast({
          type: "success",
          message: `Monitor "${formData.name}" registered successfully.`,
        });
      }
      setIsModalOpen(false);
      setEditingMonitor(null);
      await loadData(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMonitor = async (monitorId) => {
    const monitor = monitors.find((m) => m.id === monitorId);
    if (
      !window.confirm(
        `Are you sure you want to delete monitor "${monitor?.name || monitorId}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteMonitor(monitorId);
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
      setFeedbackToast({
        type: "success",
        message: "Monitor deleted successfully.",
      });
      loadData(false);
    } catch (err) {
      setFeedbackToast({
        type: "error",
        message: err.response?.data?.detail || "Failed to delete monitor.",
      });
    }
  };

  const handleToggleActive = async (monitor) => {
    try {
      await updateMonitor(monitor.id, {
        ...monitor,
        is_active: !monitor.is_active,
      });
      setMonitors((prev) =>
        prev.map((m) =>
          m.id === monitor.id ? { ...m, is_active: !m.is_active } : m,
        ),
      );
      setFeedbackToast({
        type: "info",
        message: `Monitor "${monitor.name}" is now ${!monitor.is_active ? "Active" : "Paused"}.`,
      });
    } catch (err) {
      setFeedbackToast({
        type: "error",
        message:
          err.response?.data?.detail || "Failed to toggle monitor state.",
      });
    }
  };

  const handleRunCheck = async (monitorId) => {
    setRunningCheckId(monitorId);
    try {
      const result = await triggerHealthCheck(monitorId);
      const isHealthy = (result.status || "").toUpperCase() === "HEALTHY";
      setFeedbackToast({
        type: isHealthy ? "success" : "error",
        message: `Probe result: ${result.status || "CHECKED"} • Status ${result.status_code || "N/A"} • ${Number(
          result.latency_ms || 0,
        ).toFixed(1)}ms`,
      });
      await loadData(false);
    } catch (err) {
      setFeedbackToast({
        type: "error",
        message:
          err.response?.data?.detail || "Probe execution failed or timed out.",
      });
    } finally {
      setRunningCheckId(null);
    }
  };

  const handleOpenEdit = (monitor) => {
    setEditingMonitor(monitor);
    setIsModalOpen(true);
  };

  // Compute summary stats
  const activeMonitorsCount = monitors.filter((m) => m.is_active).length;
  const healthyCount = monitors.filter(
    (m) => (m.current_status || "").toUpperCase() === "HEALTHY",
  ).length;
  const degradedCount = monitors.filter(
    (m) => (m.current_status || "").toUpperCase() === "DEGRADED",
  ).length;
  const unhealthyCount = monitors.filter(
    (m) => (m.current_status || "").toUpperCase() === "UNHEALTHY",
  ).length;
  const issueCount = degradedCount + unhealthyCount;

  // Latency calculation
  const latencies = monitors
    .map((m) => m.last_latency_ms ?? m.latency_ms)
    .filter((l) => typeof l === "number" && !isNaN(l) && l > 0);
  const avgLatency =
    metrics?.summary?.average_latency_ms ??
    (latencies.length > 0
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      : "--");

  const uptimePct =
    metrics?.summary?.uptime_percentage ??
    (monitors.length > 0
      ? ((healthyCount / monitors.length) * 100).toFixed(1)
      : 100);

  // Filter monitors
  const filteredMonitors = monitors.filter((m) => {
    const matchesSearch =
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.url || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "HEALTHY")
      return (m.current_status || "").toUpperCase() === "HEALTHY";
    if (statusFilter === "DEGRADED")
      return (m.current_status || "").toUpperCase() === "DEGRADED";
    if (statusFilter === "UNHEALTHY")
      return (m.current_status || "").toUpperCase() === "UNHEALTHY";
    return true;
  });

  return (
    <DashboardLayout
      onOpenRegisterModal={() => {
        setEditingMonitor(null);
        setIsModalOpen(true);
      }}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      <div className="space-y-6">
        {/* Feedback Toast */}
        {feedbackToast && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition animate-in fade-in ${
              feedbackToast.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : feedbackToast.type === "error"
                  ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                  : "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {feedbackToast.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : feedbackToast.type === "error" ? (
                <AlertTriangle size={18} />
              ) : (
                <Activity size={18} />
              )}
              <span>{feedbackToast.message}</span>
            </div>
            <button
              onClick={() => setFeedbackToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="shrink-0 text-rose-400" />
              <div>
                <p className="font-semibold text-sm">
                  Service Communication Error
                </p>
                <p className="text-xs text-rose-400 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMetricCard
            title="System Uptime"
            value={`${uptimePct}%`}
            subtitle="Trailing 24 hours SLA"
            icon={Activity}
            variant={
              uptimePct >= 99
                ? "success"
                : uptimePct >= 95
                  ? "warning"
                  : "danger"
            }
            trend="up"
            trendLabel="Operational"
            loading={isLoading}
          />

          <StatMetricCard
            title="Active Monitors"
            value={activeMonitorsCount}
            subtitle={`${monitors.length} Total registered`}
            icon={Server}
            variant="info"
            loading={isLoading}
          />

          <StatMetricCard
            title="Average Latency"
            value={
              typeof avgLatency === "number"
                ? `${avgLatency.toFixed(1)}ms`
                : avgLatency !== "--"
                  ? `${avgLatency}ms`
                  : "--"
            }
            subtitle="Global average probe response"
            icon={Clock}
            variant={Number(avgLatency) > 500 ? "warning" : "info"}
            loading={isLoading}
          />

          <StatMetricCard
            title="Anomalies / Outages"
            value={issueCount}
            subtitle={`${unhealthyCount} unhealthy, ${degradedCount} degraded`}
            icon={AlertTriangle}
            variant={issueCount > 0 ? "danger" : "success"}
            trend={issueCount > 0 ? "down" : "up"}
            trendLabel={
              issueCount === 0 ? "All services healthy" : "Attention needed"
            }
            loading={isLoading}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by API name or endpoint URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-[#f8fafc] placeholder-slate-500 focus:border-[#06b6d4] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#0b0f17] p-1 rounded-lg border border-[#1e293b] text-xs">
            {[
              { label: "All", value: "ALL", count: monitors.length },
              { label: "Healthy", value: "HEALTHY", count: healthyCount },
              { label: "Degraded", value: "DEGRADED", count: degradedCount },
              { label: "Unhealthy", value: "UNHEALTHY", count: unhealthyCount },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
                  statusFilter === tab.value
                    ? "bg-[#1e293b] text-[#06b6d4] font-semibold"
                    : "text-[#94a3b8] hover:text-[#f8fafc]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-mono text-slate-300">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Monitored APIs Table */}
        <MonitorsTable
          monitors={filteredMonitors}
          onRunCheck={handleRunCheck}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteMonitor}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
          runningCheckId={runningCheckId}
        />
      </div>

      {/* Register/Edit Monitor Modal */}
      <RegisterApiModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMonitor(null);
        }}
        onSubmit={handleCreateOrUpdateMonitor}
        initialData={editingMonitor}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default DashboardPage;
