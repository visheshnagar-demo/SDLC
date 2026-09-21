import React, { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import MetricSummaryCard from "../components/MetricSummaryCard";
import ApiEndpointTable from "../components/ApiEndpointTable";
import ApiRegistrationModal from "../components/ApiRegistrationModal";
import { apiService } from "../services/api";

export default function DashboardPage({ refreshTrigger }) {
  const [apis, setApis] = useState([]);
  const [failures, setFailures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedApiToEdit, setSelectedApiToEdit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [apiData, failureData] = await Promise.all([
        apiService.listApis(),
        apiService.getRecentFailures({ limit: 100 }).catch(() => []),
      ]);

      const apiList = Array.isArray(apiData) ? apiData : apiData.items || [];
      const failureList = Array.isArray(failureData)
        ? failureData
        : failureData.items || [];

      setApis(apiList);
      setFailures(failureList);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load API dashboard data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  const handleEditApi = (api) => {
    setSelectedApiToEdit(api);
    setIsModalOpen(true);
  };

  const handleCreateNewApi = () => {
    setSelectedApiToEdit(null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setSelectedApiToEdit(null);
    loadDashboardData();
  };

  // Metric computations
  const totalApis = apis.length;
  const activeApis = apis.filter((a) => a.is_active !== false).length;
  const healthyApis = apis.filter((a) => a.current_status === "Healthy").length;
  const degradedApis = apis.filter(
    (a) => a.current_status === "Degraded",
  ).length;
  const downApis = apis.filter((a) => a.current_status === "Down").length;

  const validLatencies = apis
    .map((a) => a.last_latency_ms)
    .filter((l) => typeof l === "number" && l > 0);
  const avgLatency = validLatencies.length
    ? (
        validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length
      ).toFixed(1)
    : "--";

  const overallUptime =
    totalApis > 0
      ? (((totalApis - downApis) / totalApis) * 100).toFixed(2)
      : "100.00";

  const activeFailuresCount = failures.length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f131c] border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>API Health Monitoring Overview</span>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {downApis === 0
                  ? "All Systems Operational"
                  : `${downApis} Endpoints Down`}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time probe health, latency statistics, and availability
              tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateNewApi}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register API Endpoint</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricSummaryCard
          title="Monitored APIs"
          value={totalApis}
          subtitle={`${activeApis} Active / ${totalApis - activeApis} Paused`}
          iconType="activity"
          variant="cyan"
        />
        <MetricSummaryCard
          title="Overall Uptime"
          value={`${overallUptime}%`}
          subtitle={`${healthyApis} Healthy / ${degradedApis} Degraded`}
          iconType="shield"
          variant="emerald"
        />
        <MetricSummaryCard
          title="Average Latency"
          value={avgLatency !== "--" ? `${avgLatency} ms` : "--"}
          subtitle="Real-time probe average"
          iconType="zap"
          variant={avgLatency > 200 ? "amber" : "cyan"}
        />
        <MetricSummaryCard
          title="Active Failures"
          value={activeFailuresCount}
          subtitle={
            downApis > 0 ? `${downApis} Down right now` : "0 Critical Outages"
          }
          iconType="alert"
          variant={activeFailuresCount > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Main Endpoint Table */}
      <ApiEndpointTable
        apis={apis}
        isLoading={isLoading}
        onEditApi={handleEditApi}
        onRefreshList={loadDashboardData}
      />

      {/* Modal Dialog */}
      {isModalOpen && (
        <ApiRegistrationModal
          isOpen={isModalOpen}
          apiToEdit={selectedApiToEdit}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
