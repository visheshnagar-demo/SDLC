import React from "react";
import { NavLink } from "react-router-dom";
import { Activity, Bell, Calendar, HeartPulse, Droplets } from "lucide-react";

export default function Navbar({ activeAlertCount = 0 }) {
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
    <header className="border-b border-[#1e2e45] bg-[#0c141f]/95 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 text-[#00e5ff] font-mono text-xl font-bold tracking-wider hover:opacity-90 transition-opacity"
        >
          <Droplets className="w-6 h-6 text-[#00e5ff]" />
          <span>AquaSense</span>
        </NavLink>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#064e3b] text-[#34d399] border border-[#059669]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse"></span>
          LIVE SYNC
        </span>
      </div>

      <nav className="flex items-center gap-1 sm:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#1e2e45] text-[#00e5ff] shadow-sm border border-[#00e5ff]/30"
                    : "text-[#bac9cc] hover:text-[#dbe3f3] hover:bg-[#141c27]"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#4c0519] text-[#fb7185] border border-[#fb7185]/40 animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="hidden lg:flex items-center gap-4">
        {activeAlertCount > 0 ? (
          <span className="px-3 py-1 rounded bg-[#4c0519] text-[#fb7185] font-mono text-xs font-bold border border-[#fb7185]/40">
            {activeAlertCount} Active Alert{activeAlertCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="px-3 py-1 rounded bg-[#064e3b]/80 text-[#34d399] font-mono text-xs font-medium border border-[#34d399]/30">
            All Systems Safe
          </span>
        )}
        <div className="flex items-center gap-2 text-sm text-[#bac9cc] border-l border-[#1e2e45] pl-4">
          <div className="w-7 h-7 rounded-full bg-[#1e2e45] flex items-center justify-center text-xs font-bold text-[#00e5ff]">
            ER
          </div>
          <span className="font-medium text-xs text-[#dbe3f3]">
            Dr. Elena Rostova
          </span>
        </div>
      </div>
    </header>
  );
}
