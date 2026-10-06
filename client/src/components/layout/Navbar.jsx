import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Binary,
  Milk,
  HeartPulse,
  Stethoscope,
  Wheat,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default function Navbar({ activeWithholdingCount = 0 }) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/cattle", label: "Cattle Directory", icon: Binary },
    { path: "/milking", label: "Milking Station", icon: Milk },
    { path: "/breeding", label: "Breeding Lifecycle", icon: HeartPulse },
    { path: "/health", label: "Health & Withdrawals", icon: Stethoscope },
  ];

  return (
    <header className="bg-white border-b border-[#DBE5E0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#0D7A52] flex items-center justify-center text-white font-bold text-xl shadow-sm">
                🐄
              </div>
              <div>
                <span className="font-bold text-lg text-[#171F24] tracking-tight">
                  CattleCare
                </span>
                <span className="text-xs text-[#6B7A73] block leading-none">
                  Dairy Herd System
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive
                        ? "bg-[#E7F5EE] text-[#0D7A52]"
                        : "text-[#6B7A73] hover:text-[#171F24] hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {activeWithholdingCount > 0 && (
              <div
                data-testid="withholding-pill"
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#FDF0ED] border border-[#E76F51] text-[#E76F51] rounded-full text-xs font-semibold animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{activeWithholdingCount} Milk Withholding Active</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-xs text-[#6B7A73] bg-[#F5FAF7] px-3 py-1.5 rounded-md border border-[#DBE5E0]">
              <span className="w-2 h-2 rounded-full bg-[#149E4D]"></span>
              <span>Parlor Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
