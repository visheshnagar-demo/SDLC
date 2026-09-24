import React from "react";
import { Search, Filter, RefreshCw, PlusCircle } from "lucide-react";

export default function AlertFilterToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  severityFilter,
  onSeverityChange,
  onRefresh,
  onOpenEvaluateModal,
  loading,
}) {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
      <div className="relative flex-1 min-w-[260px] max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Account ID, Alert ID, Merchant..."
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="NEW">NEW</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="ESCALATED">ESCALATED</option>
          <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD</option>
          <option value="DISMISSED">DISMISSED</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => onSeverityChange(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Alerts"
          className="p-2 border border-slate-300 rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>

        {onOpenEvaluateModal && (
          <button
            onClick={onOpenEvaluateModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Transaction</span>
          </button>
        )}
      </div>
    </div>
  );
}
