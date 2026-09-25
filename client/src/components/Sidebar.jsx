import React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  Calendar,
  HeartPulse,
  Droplets,
  ShieldAlert,
  Cpu,
} from "lucide-react";

export default function Sidebar({ activeAlertCount = 0, currentTank = null }) {
  const navItems = [
    { to: "/", label: "Live Telemetry", icon: Activity },
    {
      to: "/alerts",
      label: "Thresholds & Alerts",
      icon: Bell,
      badge: activeAlertCount,
    },
    { to: "/feeding", label: "Feeding Schedules", icon: Calendar },
    { to: "/health-equipment", label: "Health & Equipment", icon: HeartPulse },
  ];

  return (
    <aside className="w-64 bg-[#141c27] border-r border-[#1e2e45] flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-2 text-[#00e5ff] font-mono font-bold text-lg">
          <Droplets className="w-5 h-5 text-[#00e5ff]" />
          <span>AquaSense Portal</span>
        </div>

        {currentTank && (
          <div className="p-3 rounded-lg bg-[#0c141f] border border-[#1e2e45] space-y-1">
            <div className="text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider">
              Active Tank
            </div>
            <div className="font-mono text-sm font-semibold text-[#c3f5ff] truncate">
              {currentTank.name}
            </div>
            <div className="text-xs text-[#8899a6] font-mono">
              {currentTank.water_type || "Freshwater"} •{" "}
              {currentTank.capacity_liters || 0}L
            </div>
          </div>
        )}

        <nav className="space-y-1.5 font-mono text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#1e2e45] text-[#00e5ff] font-bold border border-[#00e5ff]/30"
                      : "text-[#bac9cc] hover:text-[#dbe3f3] hover:bg-[#0c141f]"
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#00e5ff]" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#4c0519] text-[#fb7185] border border-[#fb7185]/40 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#1e2e45] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[#bac9cc]">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#34d399]" />
            Telemetry Engine
          </span>
          <span className="text-[#34d399]">ONLINE</span>
        </div>
        {activeAlertCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-[#4c0519]/40 border border-[#fb7185]/40 text-xs font-mono text-[#fb7185]">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>
              {activeAlertCount} parameter breach
              {activeAlertCount > 1 ? "es" : ""} detected
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
