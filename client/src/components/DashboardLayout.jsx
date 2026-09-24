import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Activity,
  Plus,
  RefreshCw,
  ShieldAlert,
  BarChart3,
  LayoutDashboard,
  Server,
} from "lucide-react";

export const DashboardLayout = ({
  children,
  onOpenRegisterModal,
  onRefresh,
  isRefreshing = false,
}) => {
  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Failure Logs", path: "/failures", icon: ShieldAlert },
    { name: "Historical Analytics", path: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="bg-[#0f131c] min-h-screen text-[#f8fafc] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-[#111827]/90 backdrop-blur-md border-b border-[#1e293b] px-4 lg:px-8 py-3.5 transition">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Environment Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 border border-cyan-500/30 group-hover:border-cyan-400/60 transition shadow-lg shadow-cyan-500/10">
                <Activity className="text-[#06b6d4] w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#f8fafc] group-hover:text-cyan-400 transition">
                  API Health Sentinel
                </h1>
                <p className="text-[10px] font-mono text-[#94a3b8]">
                  Continuous Reliability & Telemetry
                </p>
              </div>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 bg-[#1e293b] text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Prod - us-east-1
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 bg-[#0b0f17] p-1 rounded-xl border border-[#1e293b]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-[#1e293b] text-[#06b6d4] shadow-sm font-semibold"
                        : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-slate-800/50"
                    }`
                  }
                >
                  <Icon size={15} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Actions: Refresh & Register */}
          <div className="flex items-center gap-2.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh telemetry status"
                className="p-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 hover:text-[#f8fafc] border border-[#334155] transition disabled:opacity-50"
                aria-label="Refresh telemetry data"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin text-[#06b6d4]" : ""}
                />
              </button>
            )}

            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="bg-[#06b6d4] hover:bg-[#22d3ee] text-[#0b0f17] font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition active:scale-95"
              >
                <Plus size={15} />
                <span>Register New API</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] bg-[#0b0f17] py-6 text-xs text-[#94a3b8]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-[#06b6d4]" />
            <span>
              API Health Monitoring Service • SRE Operations & Real-Time
              Telemetry
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span>FastAPI 0.110</span>
            <span>React 18 + Vite</span>
            <span>PostgreSQL 15</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
