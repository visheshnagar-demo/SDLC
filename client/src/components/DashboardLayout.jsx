import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Plus,
  RefreshCw,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ApiRegistrationModal from "./ApiRegistrationModal";
import { apiService } from "../services/api";

export default function DashboardLayout({
  children,
  onRefreshNeeded,
  refreshCount,
}) {
  const location = useLocation();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState("us-east-01");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState("30s");

  const fetchGlobalStats = async () => {
    try {
      const failures = await apiService.getRecentFailures({ limit: 100 });
      const failureList = Array.isArray(failures)
        ? failures
        : failures.items || [];
      setFailureCount(failureList.length);
    } catch {
      // Keep existing count on transient failure
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, [refreshCount]);

  useEffect(() => {
    if (autoRefreshInterval === "off") return;
    const ms =
      autoRefreshInterval === "15s"
        ? 15000
        : autoRefreshInterval === "30s"
          ? 30000
          : 60000;
    const interval = setInterval(() => {
      if (onRefreshNeeded) onRefreshNeeded();
      fetchGlobalStats();
    }, ms);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, onRefreshNeeded]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshNeeded) {
      await onRefreshNeeded();
    }
    await fetchGlobalStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleApiSaved = () => {
    setIsRegisterOpen(false);
    if (onRefreshNeeded) {
      onRefreshNeeded();
    }
    fetchGlobalStats();
  };

  const isFailuresPage = location.pathname.startsWith("/failures");
  const isDashboardPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#0f131c] border-b border-slate-800/80 px-6 py-3.5 sticky top-0 z-40 shadow-lg backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  to="/"
                  className="text-lg font-bold text-slate-100 hover:text-cyan-400 transition-colors"
                >
                  API Health Monitoring
                </Link>
                <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Real-Time Telemetry &amp; Availability Dashboard
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            {/* Cluster Selector */}
            <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <select
                aria-label="Cluster"
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="us-east-01" className="bg-[#0f131c]">
                  Cluster: us-east-01
                </option>
                <option value="us-west-02" className="bg-[#0f131c]">
                  Cluster: us-west-02
                </option>
                <option value="eu-central-01" className="bg-[#0f131c]">
                  Cluster: eu-central-01
                </option>
              </select>
            </div>

            {/* Auto-Refresh dropdown */}
            <div className="flex items-center space-x-1.5 bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`}
              />
              <select
                aria-label="Auto Refresh"
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="15s" className="bg-[#0f131c]">
                  Auto: 15s
                </option>
                <option value="30s" className="bg-[#0f131c]">
                  Auto: 30s
                </option>
                <option value="60s" className="bg-[#0f131c]">
                  Auto: 60s
                </option>
                <option value="off" className="bg-[#0f131c]">
                  Auto: Off
                </option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              title="Refresh Now"
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`}
              />
            </button>

            {/* Navigation Tabs */}
            <Link
              to="/"
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center space-x-1.5 ${
                isDashboardPage
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  : "bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>

            <Link
              to="/failures"
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center space-x-1.5 ${
                isFailuresPage
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Failures</span>
              {failureCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-slate-950">
                  {failureCount}
                </span>
              )}
            </Link>

            {/* Register API Button */}
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-3.5 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register API</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f131c] border-t border-slate-800/80 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Health Telemetry Agent Active</span>
          <span className="text-slate-600">|</span>
          <span>30-Day Historical Log Retention</span>
        </div>
        <div className="text-slate-500">
          API Monitoring &bull; React 18 &bull; FastAPI Telemetry
        </div>
      </footer>

      {/* Register Modal */}
      {isRegisterOpen && (
        <ApiRegistrationModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={handleApiSaved}
        />
      )}
    </div>
  );
}
