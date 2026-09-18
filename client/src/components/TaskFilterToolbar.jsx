import React from "react";
import PropTypes from "prop-types";

export default function TaskFilterToolbar({
  filter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  counts,
}) {
  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>
      <div className="relative w-full sm:w-64">
        <label htmlFor="toolbar-search" className="sr-only">
          Search tasks
        </label>
        <input
          id="toolbar-search"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search filtered tasks..."
          className="w-full pl-8 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
          🔍
        </span>
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

TaskFilterToolbar.propTypes = {
  filter: PropTypes.oneOf(["all", "active", "completed"]).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  counts: PropTypes.shape({
    all: PropTypes.number.isRequired,
    active: PropTypes.number.isRequired,
    completed: PropTypes.number.isRequired,
  }).isRequired,
};
