import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Edit2,
  Trash2,
  Clock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Activity,
  Layers,
  Terminal,
  RefreshCw,
} from "lucide-react";
import TelemetryLatencyChart from "../components/TelemetryLatencyChart";
import UptimeAvailabilityHeatmap from "../components/UptimeAvailabilityHeatmap";
import FailureInspectorDrawer from "../components/FailureInspectorDrawer";
import ApiRegistrationModal from "../components/ApiRegistrationModal";
import { apiService } from "../services/api";

export default function ApiDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [apiData, setApiData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [timeframe, setTimeframe] = useState("24h");
  const [isLoading, setIsLoading] = useState(true);
  const [isProbing, setIsProbing] = useState(false);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLogForDrawer, setSelectedLogForDrawer] = useState(null);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [apiRes, metricsRes, logsRes] = await Promise.all([
        apiService.getApiById(id),
        apiService.getApiMetrics(id, { timeframe }).catch(() => null),
        apiService.getApiHealthLogs(id, { limit: 50 }).catch(() => []),
      ]);

      setApiData(apiRes);
      setMetrics(metricsRes);
      setLogs(Array.isArray(logsRes) ? logsRes : logsRes.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load API details",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, timeframe]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleTriggerProbe = async () => {
    try {
      setIsProbing(true);
      setError(null);
      await apiService.triggerHealthCheck(id);
      await loadDetails();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to execute immediate probe",
      );
    } finally {
      setIsProbing(false);
    }
  };

  const handleDeleteApi = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${apiData?.name} and all its historical records?`,
      )
    ) {
      return;
    }
    try {
      await apiService.deleteApi(id);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete API");
    }
  };

  if (isLoading && !apiData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono">
          Loading API telemetry and details...
        </p>
      </div>
    );
  }

  if (error && !apiData) {
    return (
      <div className="bg-[#0f131c] border border-rose-500/30 p-8 rounded-xl text-center max-w-lg mx-auto my-12 space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-100">
          API Endpoint Not Found
        </h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const currentStatus = apiData?.current_status || "Unknown";
  const statusBadge =
    currentStatus === "Healthy"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : currentStatus === "Degraded"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-rose-500/10 text-rose-400 border-rose-500/30";

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Link
            to="/"
            className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-semibold truncate max-w-xs">
            {apiData?.name || "API Details"}
          </span>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-1 bg-[#0f131c] border border-slate-800 p-1 rounded-lg text-xs font-mono">
          {["24h", "7d", "30d"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded transition ${
                timeframe === tf
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-[#0f131c] border border-slate-800 p-6 rounded-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {apiData?.http_method || "GET"}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
              {apiData?.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge}`}
            >
              {currentStatus}
            </span>
          </div>
          <p className="text-xs font-mono text-cyan-400/90 mt-1.5 break-all">
            {apiData?.target_url}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleTriggerProbe}
            disabled={isProbing}
            className="px-3.5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition"
          >
            <Play
              className={`w-3.5 h-3.5 ${isProbing ? "animate-spin" : ""}`}
            />
            <span>{isProbing ? "Probing..." : "Trigger Probe Now"}</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-700 transition"
            title="Edit Configuration"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDeleteApi}
            className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 transition"
            title="Delete API"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f131c] border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            Uptime ({timeframe})
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {metrics?.uptime_pct !== undefined
              ? `${metrics.uptime_pct.toFixed(2)}%`
              : "100.00%"}
          </span>
        </div>
        <div className="bg-[#0f131c] border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            Avg Latency
          </span>
          <span className="text-xl font-bold font-mono text-cyan-400">
            {metrics?.avg_latency_ms !== undefined
              ? `${metrics.avg_latency_ms.toFixed(1)} ms`
              : "--"}
          </span>
        </div>
        <div className="bg-[#0f131c] border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            P95 Latency
          </span>
          <span className="text-xl font-bold font-mono text-amber-400">
            {metrics?.p95_latency_ms !== undefined
              ? `${metrics.p95_latency_ms.toFixed(1)} ms`
              : "--"}
          </span>
        </div>
        <div className="bg-[#0f131c] border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            Total Probes
          </span>
          <span className="text-xl font-bold font-mono text-slate-200">
            {metrics?.total_probes ?? logs.length}
          </span>
        </div>
      </div>

      {/* Heatmap & Latency Chart */}
      <div className="space-y-6">
        <UptimeAvailabilityHeatmap
          uptimePercentage={metrics?.uptime_pct ?? 100}
          timeframe={timeframe}
        />
        <TelemetryLatencyChart
          timeSeriesData={
            metrics?.time_series ||
            logs.map((l) => ({
              timestamp: l.checked_at,
              avg_latency_ms: l.latency_ms,
              p95_latency_ms: (l.latency_ms || 0) * 1.15,
            }))
          }
          timeframe={timeframe}
        />
      </div>

      {/* Configuration Metadata & Historical Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Metadata Box */}
        <div className="bg-[#0f131c] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Endpoint Configuration</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-mono text-[11px]">
                Probe Interval
              </span>
              <span className="text-slate-200 font-semibold font-mono">
                {apiData?.interval_seconds} seconds
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[11px]">
                Expected HTTP Status
              </span>
              <span className="text-emerald-400 font-semibold font-mono">
                {apiData?.expected_status || 200} OK
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[11px]">
                Timeout Threshold
              </span>
              <span className="text-slate-200 font-semibold font-mono">
                {apiData?.timeout_seconds || 5.0} seconds
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[11px]">
                Polling State
              </span>
              <span
                className={`font-semibold ${apiData?.is_active !== false ? "text-emerald-400" : "text-slate-500"}`}
              >
                {apiData?.is_active !== false ? "Active Polling" : "Paused"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[11px]">
                Configured Headers
              </span>
              <pre className="mt-1 bg-[#0b0f17] p-2 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-32">
                {apiData?.request_headers
                  ? JSON.stringify(apiData.request_headers, null, 2)
                  : "// No custom headers"}
              </pre>
            </div>
          </div>
        </div>

        {/* Historical Probe Logs Table */}
        <div className="lg:col-span-2 bg-[#0f131c] border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-[#111622] flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent Probe History</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {logs.length} Recorded Probes
            </span>
          </div>

          <div className="flex-1 overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0b0f17] text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Status Code</th>
                  <th className="px-4 py-2.5">Latency</th>
                  <th className="px-4 py-2.5">Result</th>
                  <th className="px-4 py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No probe history recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSuccess =
                      log.is_success !== false &&
                      (log.response_status ===
                        (apiData?.expected_status || 200) ||
                        log.operational_status === "Healthy");
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/30 transition"
                      >
                        <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                          {log.checked_at
                            ? new Date(log.checked_at).toLocaleTimeString()
                            : "--"}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-bold">
                          <span
                            className={
                              log.response_status ===
                              (apiData?.expected_status || 200)
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {log.response_status || "ERR"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {log.latency_ms !== null &&
                          log.latency_ms !== undefined
                            ? `${log.latency_ms.toFixed(1)} ms`
                            : "--"}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              isSuccess
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {log.operational_status ||
                              (isSuccess ? "Healthy" : "Down")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLogForDrawer(log)}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ApiRegistrationModal
          isOpen={isEditModalOpen}
          apiToEdit={apiData}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            loadDetails();
          }}
        />
      )}

      {/* Failure Inspector Drawer */}
      {selectedLogForDrawer && (
        <FailureInspectorDrawer
          isOpen={!!selectedLogForDrawer}
          logEntry={selectedLogForDrawer}
          onClose={() => setSelectedLogForDrawer(null)}
        />
      )}
    </div>
  );
}
