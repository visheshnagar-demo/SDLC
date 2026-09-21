import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Layers,
  Plus,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export default function DashboardLayout({
  children,
  onOpenRegisterModal,
  onRefresh,
  isRefreshing = false,
  systemStatus = "Operational",
  activeFailuresCount = 0,
}) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#dfe2ee] flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#0f131c]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">
                  API Pulse
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-Time Health & Telemetry
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-800 text-xs">
            {activeFailuresCount > 0 ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>
                  {activeFailuresCount} Active Failure
                  {activeFailuresCount > 1 ? "s" : ""}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {systemStatus === "Operational"
                    ? "All Systems Operational"
                    : systemStatus}
                </span>
              </span>
            )}
            <span className="px-2 py-1 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 font-mono">
              Cluster: us-east-01
            </span>
          </div>
        </div>

        {/* Action and Navigation Links */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <nav className="flex items-center space-x-1 bg-[#111622] p-1 rounded-lg border border-slate-800 mr-2">
            <Link
              to="/"
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                location.pathname === "/"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/failures"
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                location.pathname === "/failures"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Failures</span>
              {activeFailuresCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-slate-950 font-bold">
                  {activeFailuresCount}
                </span>
              )}
            </Link>
          </nav>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Telemetry"
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`}
              />
            </button>
          )}

          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-md shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register API</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0f131c]/60 py-4 px-4 sm:px-8 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span>API Health Monitoring System</span>
          <span>•</span>
          <span className="text-slate-400">30-day Retention Enabled</span>
        </div>
        <div className="text-slate-400">
          Auto-probe interval: 30s / 60s / 300s
        </div>
      </footer>
    </div>
  );
}
