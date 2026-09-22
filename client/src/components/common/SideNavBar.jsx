import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  CloudSun,
  ScrollText,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function SideNavBar() {
  const navItems = [
    { to: "/", label: "Overview & Dashboard", icon: LayoutDashboard },
    { to: "/provision", label: "Provision VM", icon: PlusCircle },
    { to: "/providers", label: "Cloud Providers", icon: CloudSun },
    { to: "/audit-logs", label: "Audit Logs & Governance", icon: ScrollText },
  ];

  return (
    <aside className="w-64 bg-[#060e20] border-r border-[#1e293b] flex flex-col justify-between p-4 min-h-[calc(100vh-57px)]">
      <div>
        {/* Section Label */}
        <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-3 mb-2 font-mono">
          Infrastructure Management
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/30 shadow-sm"
                      : "text-[#bcc9cd] hover:text-[#dae2fd] hover:bg-[#0f172a]"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Insights / Metrics Banner */}
        <div className="mt-8 bg-[#0b1326] border border-[#1e293b] rounded-xl p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#dae2fd] mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#06b6d4]" /> Real-Time Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping"></span>
          </div>
          <p className="text-[11px] text-[#bcc9cd] leading-relaxed">
            Polling telemetry & VM status across AWS, GCP, Azure clusters every
            10s.
          </p>
        </div>
      </div>

      {/* Security & System Info Footer */}
      <div className="bg-[#0b1326] border border-[#1e293b] rounded-xl p-3 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-[#bcc9cd]">
          <span>Security Engine:</span>
          <span className="text-[#10b981] font-mono font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> AES-256-GCM
          </span>
        </div>
        <div className="flex items-center justify-between text-[#bcc9cd]">
          <span>API Gateway:</span>
          <span className="text-[#06b6d4] font-mono">FastAPI / REST</span>
        </div>
        <div className="flex items-center justify-between text-[#bcc9cd]">
          <span>Audit Proof:</span>
          <span className="text-[#38bdf8] font-mono">SHA-256 Merkle</span>
        </div>
      </div>
    </aside>
  );
}
