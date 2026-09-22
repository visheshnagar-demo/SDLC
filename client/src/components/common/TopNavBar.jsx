import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Cloud,
  Search,
  ShieldCheck,
  User,
  ChevronDown,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
} from "lucide-react";

export default function TopNavBar({ currentUser, onRoleChange, onRefresh }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState("us-east-prod");

  return (
    <header className="border-b border-[#1e293b] bg-[#060e20] px-6 py-3 flex justify-between items-center sticky top-0 z-40">
      {/* Brand & Version */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-1.5 bg-[#06b6d4]/10 rounded-lg border border-[#06b6d4]/30 group-hover:border-[#06b6d4] transition-colors">
            <Cloud className="w-5 h-5 text-[#06b6d4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#06b6d4] tracking-tight">
                CloudPulse
              </span>
              <span className="bg-[#171f33] text-[10px] px-2 py-0.5 rounded font-mono text-[#bcc9cd] border border-[#3d494c]">
                Core v2.4
              </span>
            </div>
            <span className="text-[10px] text-[#bcc9cd] hidden md:block">
              Multi-Cloud Orchestrator
            </span>
          </div>
        </Link>

        {/* Cluster / Region Selector */}
        <div className="hidden lg:flex items-center bg-[#0b1326] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs">
          <span className="text-[#bcc9cd] mr-2">Cluster:</span>
          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="bg-transparent text-[#dae2fd] font-mono focus:outline-none cursor-pointer"
          >
            <option value="us-east-prod" className="bg-[#0f172a]">
              us-east-prod (Multi-Cloud)
            </option>
            <option value="eu-west-staging" className="bg-[#0f172a]">
              eu-west-staging (AWS/GCP)
            </option>
            <option value="ap-south-dr" className="bg-[#0f172a]">
              ap-south-dr (Azure)
            </option>
          </select>
        </div>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#bcc9cd] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search VMs, providers, IPs, tags... (⌘K)"
            className="w-full bg-[#0b1326] border border-[#1e293b] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#dae2fd] placeholder-[#64748b] focus:outline-none focus:border-[#06b6d4] transition-colors"
          />
        </div>
      </div>

      {/* Provider Status & Actions */}
      <div className="flex items-center gap-3">
        {/* Cloud Health Badges */}
        <div className="hidden xl:flex items-center gap-2 bg-[#0b1326] border border-[#1e293b] px-3 py-1 rounded-lg text-[11px]">
          <span className="text-[#bcc9cd]">Providers:</span>
          <span className="flex items-center gap-1 text-[#10b981] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>{" "}
            AWS
          </span>
          <span className="text-[#1e293b]">|</span>
          <span className="flex items-center gap-1 text-[#10b981] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> GCP
          </span>
          <span className="text-[#1e293b]">|</span>
          <span className="flex items-center gap-1 text-[#10b981] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>{" "}
            Azure
          </span>
        </div>

        {/* Quick Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Metrics & State"
            className="p-1.5 bg-[#0b1326] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-[#bcc9cd] hover:text-[#dae2fd] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Provision VM Quick Action */}
        <Link
          to="/provision"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06b6d4] hover:bg-[#38bdf8] text-[#0b1326] text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Provision VM</span>
        </Link>

        {/* User Profile & RBAC Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-[#0b1326] hover:bg-[#0f172a] border border-[#1e293b] px-2.5 py-1.5 rounded-lg transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full bg-[#06b6d4]/20 border border-[#06b6d4]/40 flex items-center justify-center text-[#06b6d4]">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-[#dae2fd]">
                {currentUser?.email || "admin@example.com"}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    currentUser?.role === "ADMIN"
                      ? "bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/40"
                      : "bg-[#64748b]/20 text-[#bcc9cd] border border-[#64748b]/40"
                  }`}
                >
                  {currentUser?.role || "ADMIN"}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#bcc9cd]" />
          </button>

          {/* User & Role Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-xl p-3 z-50">
              <div className="text-xs text-[#bcc9cd] font-semibold uppercase tracking-wider mb-2">
                Active User & Role (RBAC)
              </div>
              <div className="bg-[#0b1326] p-2.5 rounded-lg border border-[#1e293b] mb-3">
                <p className="text-xs font-semibold text-[#dae2fd]">
                  {currentUser?.full_name || "Cloud Admin"}
                </p>
                <p className="text-[11px] text-[#bcc9cd]">
                  {currentUser?.email || "admin@example.com"}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#06b6d4]" />
                  <span className="text-[11px] text-[#06b6d4] font-medium">
                    Role: {currentUser?.role || "ADMIN"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[11px] text-[#64748b] font-medium px-1">
                  Switch RBAC Role Simulation:
                </div>
                <button
                  onClick={() => {
                    onRoleChange && onRoleChange("ADMIN");
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                    currentUser?.role === "ADMIN"
                      ? "bg-[#06b6d4]/20 text-[#06b6d4] font-medium"
                      : "hover:bg-[#1e293b] text-[#dae2fd]"
                  }`}
                >
                  <span>Administrator (Full Control)</span>
                  {currentUser?.role === "ADMIN" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#06b6d4]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    onRoleChange && onRoleChange("READ_ONLY");
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                    currentUser?.role === "READ_ONLY"
                      ? "bg-[#06b6d4]/20 text-[#06b6d4] font-medium"
                      : "hover:bg-[#1e293b] text-[#dae2fd]"
                  }`}
                >
                  <span>Read-Only Auditor (View Only)</span>
                  {currentUser?.role === "READ_ONLY" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#06b6d4]" />
                  )}
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1e293b] text-[11px] text-[#64748b] px-1">
                Test Accounts: test@example.com / admin@example.com
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
