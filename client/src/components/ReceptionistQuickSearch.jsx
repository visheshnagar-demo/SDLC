import React, { useState } from "react";
import { Search, QrCode, X, Filter, Sparkles, Barcode } from "lucide-react";

export default function ReceptionistQuickSearch({
  onSearch,
  initialQuery = "",
  loading = false,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        query: query.trim() || undefined,
        status: selectedStatus || undefined,
      });
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    if (onSearch) {
      onSearch({
        query: query.trim() || undefined,
        status: status || undefined,
      });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSelectedStatus("");
    if (onSearch) {
      onSearch({});
    }
  };

  const handleSimulateScan = (sampleCode) => {
    setQuery(sampleCode);
    if (onSearch) {
      onSearch({
        query: sampleCode,
        status: selectedStatus || undefined,
      });
    }
  };

  const statuses = [
    { label: "All Visitors", value: "" },
    { label: "Approved (Ready to In)", value: "APPROVED" },
    { label: "Checked-In (On-Premises)", value: "CHECKED_IN" },
    { label: "Checked-Out", value: "CHECKED_OUT" },
    { label: "Pending Approval", value: "PENDING_APPROVAL" },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <form
        onSubmit={handleFormSubmit}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Pass Code (e.g. VP-A1B2C3D4), Visitor Name, Email, or Phone..."
            className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            "Searching..."
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search Roster
            </>
          )}
        </button>
      </form>

      {/* Quick Filter Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 flex items-center mr-1">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Filter:
          </span>
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleStatusChange(s.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === s.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Rapid Barcode / Scanner simulation tip */}
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <Barcode className="w-3.5 h-3.5 text-indigo-500" />
          <span>Scanner Ready</span>
        </div>
      </div>
    </div>
  );
}
