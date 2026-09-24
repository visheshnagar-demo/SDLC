import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { FailureLogStream } from "../components/FailureLogStream";
import { ProbeInspectorPanel } from "../components/ProbeInspectorPanel";
import { getHealthLogs, getMonitors } from "../services/api";
import { ShieldAlert, AlertTriangle, Server } from "lucide-react";

export const FailureLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsLoading(true);
      setError(null);
      try {
        const [logsRes, monitorsRes] = await Promise.allSettled([
          getHealthLogs({
            failure_only: true,
            ...(selectedMonitorId ? { monitor_id: selectedMonitorId } : {}),
            limit: 100,
          }),
          getMonitors(),
        ]);

        if (logsRes.status === "fulfilled") {
          const data = logsRes.value;
          const logItems = Array.isArray(data) ? data : data?.items || [];
          // Filter for failures if backend returns all
          const failedLogs = logItems.filter((l) => {
            const st = (l.status || "").toUpperCase();
            return (
              st === "UNHEALTHY" ||
              st === "DEGRADED" ||
              st === "DOWN" ||
              (l.status_code && (l.status_code >= 400 || l.status_code === 0))
            );
          });
          setLogs(failedLogs.length > 0 ? failedLogs : logItems);
        } else {
          throw logsRes.reason;
        }

        if (monitorsRes.status === "fulfilled") {
          setMonitors(
            Array.isArray(monitorsRes.value)
              ? monitorsRes.value
              : monitorsRes.value?.items || [],
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to retrieve failure telemetry logs.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedMonitorId],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs(false);
  };

  const unhealthyCount = logs.filter(
    (l) => (l.status || "").toUpperCase() === "UNHEALTHY",
  ).length;
  const degradedCount = logs.filter(
    (l) => (l.status || "").toUpperCase() === "DEGRADED",
  ).length;

  return (
    <DashboardLayout onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div className="space-y-6">
        {/* Header Title & Intro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
          <div>
            <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2.5">
              <ShieldAlert className="text-rose-400 w-6 h-6" />
              <span>Failure Logs & Exception Diagnostics</span>
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1">
              Investigate unhealthy probes, network timeouts, status mismatches,
              and diagnostic waterfalls.
            </p>
          </div>

          {/* Service Selector Filter */}
          <div className="flex items-center gap-2">
            <Server size={15} className="text-[#06b6d4]" />
            <select
              value={selectedMonitorId}
              onChange={(e) => setSelectedMonitorId(e.target.value)}
              className="bg-[#111827] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#f8fafc] focus:border-[#06b6d4] outline-none"
            >
              <option value="">All Monitored Services</option>
              {monitors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.http_method})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Anomaly Notification Bar */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>
              {logs.length > 0
                ? `${logs.length} Anomalous Events Detected (${unhealthyCount} Unhealthy, ${degradedCount} Degraded) — Filter Active: Failure Events Only`
                : "All endpoints are currently responding within expected thresholds."}
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Auto-grouped by probe execution time
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-sm">
                Failed to Load Failure Logs
              </p>
              <p className="text-xs text-rose-400">{error}</p>
            </div>
            <button
              onClick={() => fetchLogs()}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Failure Logs Stream */}
        <FailureLogStream
          logs={logs}
          onSelectLog={(log) => setSelectedLog(log)}
          isLoading={isLoading}
          filterStatus={filterStatus}
          onFilterChange={(st) => setFilterStatus(st)}
        />
      </div>

      {/* Slide-out Diagnostic Inspector Panel */}
      <ProbeInspectorPanel
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </DashboardLayout>
  );
};

export default FailureLogsPage;
