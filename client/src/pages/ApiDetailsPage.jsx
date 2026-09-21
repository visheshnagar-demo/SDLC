import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  RefreshCw,
  ShieldAlert,
  Server,
  Layers,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import TelemetryLatencyChart from "../components/TelemetryLatencyChart";
import UptimeAvailabilityHeatmap from "../components/UptimeAvailabilityHeatmap";
import FailureInspectorDrawer from "../components/FailureInspectorDrawer";
import ApiRegistrationModal from "../components/ApiRegistrationModal";
import {
  getApiDetails,
  getApiMetrics,
  getApiLogs,
  triggerApiCheck,
  updateApi,
  deleteApi,
} from "../services/api";

export default function ApiDetailsPage() {
  const { apiId } = useParams();
  const navigate = useNavigate();

  const [api, setApi] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [timeframe, setTimeframe] = useState("24h");
  const [logFilter, setLogFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isProbing, setIsProbing] = useState(false);
  const [error, setError] = useState(null);

  // Inspector & Modal
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchApiData = useCallback(async () => {
    setError(null);
    try {
      const [apiRes, metricsRes, logsRes] = await Promise.all([
        getApiDetails(apiId),
        getApiMetrics(apiId, timeframe),
        getApiLogs(apiId, { limit: 50, offset: 0, status_filter: logFilter }),
      ]);
      setApi(apiRes);
      setMetrics(metricsRes);
      setLogs(logsRes || []);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch API telemetry.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  }, [apiId, timeframe, logFilter]);

  useEffect(() => {
    fetchApiData();
    const timer = setInterval(() => {
      fetchApiData();
    }, 20000);
    return () => clearInterval(timer);
  }, [fetchApiData]);

  const handleTriggerProbe = async () => {
    setIsProbing(true);
    try {
      const logResult = await triggerApiCheck(apiId);
      setNotice({
        type: logResult.is_success ? "success" : "error",
        message: `Probe completed: ${logResult.operational_status} in ${logResult.latency_ms?.toFixed(1)}ms (HTTP ${logResult.response_status || "N/A"})`,
      });
      await fetchApiData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Probe execution failed.";
      setNotice({
        type: "error",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsProbing(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleEditSubmit = async (payload) => {
    setIsSaving(true);
    try {
      await updateApi(apiId, payload);
      setNotice({ type: "success", message: "API configuration updated." });
      setIsEditModalOpen(false);
      await fetchApiData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to update API.";
      setNotice({
        type: "error",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Permanently delete '${api?.name || apiId}' and all historical metrics?`,
      )
    ) {
      return;
    }
    try {
      await deleteApi(apiId);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to delete API.";
      setNotice({
        type: "error",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    }
  };

  const handleInspectLog = (log) => {
    setSelectedFailure({
      ...log,
      api_name: api?.name,
      target_url: api?.target_url,
    });
    setIsInspectorOpen(true);
  };

  const getStatusBadge = (status) => {
    const s = (status || "unknown").toLowerCase();
    if (s === "healthy") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Healthy</span>
        </span>
      );
    }
    if (s === "degraded") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Degraded</span>
        </span>
      );
    }
    if (s === "down") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" />
          <span>Down</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending</span>
      </span>
    );
  };

  if (isLoading && !api) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span>Loading API telemetry and analytics...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !api) {
    return (
      <DashboardLayout>
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-xl mx-auto my-12 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold">Failed to Load API</h2>
          <p className="text-xs text-rose-400">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onRefresh={fetchApiData} isRefreshing={isProbing}>
      <div className="space-y-6">
        {/* Breadcrumbs & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Link
              to="/"
              className="hover:text-cyan-400 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-slate-100 font-semibold font-mono truncate max-w-xs">
              {api?.name || apiId}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleTriggerProbe}
              disabled={isProbing}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <Play
                className={`w-3.5 h-3.5 ${isProbing ? "animate-spin" : ""}`}
              />
              <span>{isProbing ? "Probing..." : "Trigger Probe Now"}</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Edit Endpoint Settings"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition"
              title="Delete Endpoint"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {notice && (
          <div
            role="alert"
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition ${
              notice.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              {notice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              &times;
            </button>
          </div>
        )}

        {/* API Meta & Quick Stats Header */}
        <div className="bg-[#111622] rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {api?.http_method}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                {api?.name}
              </h1>
              {getStatusBadge(api?.current_status)}
            </div>
            <p className="text-xs font-mono text-cyan-400 break-all">
              {api?.target_url}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-slate-400 block text-[11px]">
                Avg Latency
              </span>
              <span className="text-base font-bold text-slate-100">
                {metrics?.avg_latency_ms
                  ? `${metrics.avg_latency_ms.toFixed(1)} ms`
                  : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                P95 Latency
              </span>
              <span className="text-base font-bold text-amber-400">
                {metrics?.p95_latency_ms
                  ? `${metrics.p95_latency_ms.toFixed(1)} ms`
                  : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                Uptime ({timeframe})
              </span>
              <span className="text-base font-bold text-emerald-400">
                {metrics?.uptime_pct !== undefined
                  ? `${metrics.uptime_pct.toFixed(1)}%`
                  : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Failures</span>
              <span className="text-base font-bold text-rose-400">
                {metrics?.failure_count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Heatmap & Time-Series Chart */}
        <UptimeAvailabilityHeatmap
          timeSeriesData={metrics?.time_series || []}
          uptimePct={metrics?.uptime_pct || 100}
          totalProbes={metrics?.total_probes || 0}
          failureCount={metrics?.failure_count || 0}
          timeframe={timeframe}
        />

        <TelemetryLatencyChart
          timeSeriesData={metrics?.time_series || []}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf)}
          slaThresholdMs={500}
        />

        {/* Detailed Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#111622] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Probe Parameters</span>
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-800/60">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Probe Cadence</span>
                <span className="font-mono text-slate-200">
                  {api?.interval_seconds} seconds
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Expected Status</span>
                <span className="font-mono text-emerald-400 font-bold">
                  HTTP {api?.expected_status}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Timeout Threshold</span>
                <span className="font-mono text-slate-200">
                  {api?.timeout_seconds}s
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Monitoring Active</span>
                <span
                  className={`font-semibold ${api?.is_active ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {api?.is_active ? "Enabled" : "Paused"}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#111622] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Request Headers & Payload</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block mb-1">
                  Custom Request Headers
                </span>
                <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 h-28 overflow-y-auto">
                  {api?.request_headers &&
                  Object.keys(api.request_headers).length > 0 ? (
                    <pre>{JSON.stringify(api.request_headers, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500">None configured</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">
                  Request Payload Body
                </span>
                <div className="bg-[#0b0f17] border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 h-28 overflow-y-auto whitespace-pre-wrap">
                  {api?.request_body ? (
                    api.request_body
                  ) : (
                    <span className="text-slate-500">None configured</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Probe Logs Table */}
        <div className="bg-[#111622] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Historical Health Probe Executions
              </h3>
              <p className="text-xs text-slate-400">
                Recent health check logs, latency, and status code audit
              </p>
            </div>

            <div className="flex items-center bg-[#0b0f17] p-1 rounded-lg border border-slate-800 text-xs">
              {["all", "failures", "healthy", "degraded", "down"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                      logFilter === filter
                        ? "bg-slate-800 text-cyan-400 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#0f131c]/50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">HTTP Code</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3">Outcome</th>
                  <th className="py-3 px-4 text-right">Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => !log.is_success && handleInspectLog(log)}
                      className={`hover:bg-slate-800/30 transition ${
                        !log.is_success
                          ? "cursor-pointer hover:bg-rose-950/20"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {new Date(log.checked_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(log.operational_status)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            log.response_status === 200
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {log.response_status
                            ? `HTTP ${log.response_status}`
                            : "ERR"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium">
                        <span
                          className={
                            log.latency_ms > 1000
                              ? "text-rose-400"
                              : log.latency_ms > 300
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }
                        >
                          {log.latency_ms?.toFixed(1)} ms
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {log.is_success ? (
                          <span className="text-emerald-400 font-medium">
                            Success
                          </span>
                        ) : (
                          <span className="text-rose-400 font-medium truncate max-w-xs block">
                            {log.error_message || "Probe failure"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!log.is_success && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectLog(log);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded"
                          >
                            Inspect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-slate-500"
                    >
                      No logs found for selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Failure Inspector Drawer */}
      <FailureInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        failureLog={selectedFailure}
      />

      {/* Edit API Modal */}
      <ApiRegistrationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={api}
        isLoading={isSaving}
      />
    </DashboardLayout>
  );
}
