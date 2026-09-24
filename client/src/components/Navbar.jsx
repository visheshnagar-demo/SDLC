import React from "react";
import { Shield, Search, Bell, AlertTriangle } from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  activeAlertCount = 0,
  onAlertClick,
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "catalog", label: "Artifact Catalog" },
    { id: "restorations", label: "Conservation Journal" },
    { id: "inspections", label: "Inspections" },
    { id: "loans", label: "Loan Management" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      <div
        className="flex items-center space-x-3 cursor-pointer"
        onClick={() => setActiveTab("dashboard")}
      >
        <div className="p-2 bg-indigo-950 text-white rounded-lg shadow-sm">
          <Shield className="w-5 h-5 text-indigo-200" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold text-indigo-950 tracking-tight">
            CuratorGuard
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Museum Artifact Preservation
          </p>
        </div>
      </div>

      <nav className="flex items-center space-x-1 sm:space-x-4 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "text-indigo-950 font-bold bg-indigo-50 border-b-2 border-indigo-950"
                  : "text-slate-600 hover:text-indigo-950 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center space-x-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search accession / artifact (Cmd+K)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-950 w-48 lg:w-64"
          />
        </div>

        <button
          onClick={onAlertClick}
          className="relative p-2 text-slate-600 hover:text-indigo-950 hover:bg-slate-100 rounded-lg transition-colors"
          title="Micro-Climate Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
              {activeAlertCount}
            </span>
          )}
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            EV
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800">
              Dr. Eleanor Vance
            </div>
            <div className="text-[10px] text-slate-500">Chief Conservator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
