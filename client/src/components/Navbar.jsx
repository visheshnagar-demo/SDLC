import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Shield,
  UserPlus,
  Home,
  ArrowRightLeft,
  LogOut,
  FileCheck,
} from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Inmate Intake & Booking", icon: UserPlus },
    { path: "/housing", label: "Housing & Keep-Away", icon: Home },
    { path: "/movements", label: "Movement Tracking", icon: ArrowRightLeft },
    { path: "/releases", label: "Release Compliance", icon: FileCheck },
  ];

  return (
    <header className="bg-[#0F172A] border-b border-[#334155] px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-3 mb-3 md:mb-0">
        <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg border border-blue-500/30">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">
            JMS Enterprise
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Jail Management & Security Operations
          </p>
        </div>
      </div>

      <nav className="flex space-x-1 bg-[#090D16] p-1.5 rounded-lg border border-[#334155]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:flex items-center space-x-3 text-xs text-[#94A3B8]">
        <div className="bg-[#1E293B] px-3 py-1.5 rounded-md border border-[#334155]">
          <span className="text-[#38BDF8] font-semibold">Test Officer:</span>{" "}
          test@example.com
        </div>
      </div>
    </header>
  );
}
