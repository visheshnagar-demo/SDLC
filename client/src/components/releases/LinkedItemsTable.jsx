import React, { useState } from "react";
import Badge from "../common/Badge";
import {
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  AlertOctagon,
  Clock,
  Sparkles,
} from "lucide-react";

export const LinkedItemsTable = ({
  items = [],
  onOpenAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateStatus,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.issue_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "ALL" ||
      item.issue_type?.toUpperCase() === typeFilter.toUpperCase();

    const matchesStatus =
      statusFilter === "ALL" ||
      item.resolution_status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#dae2fd]">
            Linked Features & Bugs ({items.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deliverables, bug fixes, and development items associated with this
            release.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by key or summary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#dae2fd] placeholder-slate-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#0b0f19] border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-indigo-500"
          >
            <option value="ALL">All Types</option>
            <option value="FEATURE">Features</option>
            <option value="BUG">Bugs</option>
            <option value="IMPROVEMENT">Improvements</option>
            <option value="TASK">Tasks</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b0f19] border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {onOpenAddItem && (
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="p-10 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs">Loading linked deliverables...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">No items found</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL"
              ? "No items match your filter selection."
              : "No features or bugs are linked to this release yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#131b2e]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Issue Key</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Resolution Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredItems.map((item) => {
                const isBlocker =
                  (item.priority?.toUpperCase() === "BLOCKER" ||
                    item.priority?.toUpperCase() === "CRITICAL") &&
                  item.resolution_status?.toUpperCase() !== "RESOLVED" &&
                  item.resolution_status?.toUpperCase() !== "CLOSED";

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isBlocker ? "bg-rose-950/10" : ""
                    }`}
                  >
                    {/* Issue Key */}
                    <td className="py-3 px-4 sm:px-6 font-mono font-bold text-indigo-300">
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                        {item.issue_key}
                      </span>
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-4 text-slate-200 max-w-md font-medium">
                      {item.summary}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <Badge size="sm">{item.issue_type || "Feature"}</Badge>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <Badge size="sm">{item.priority || "Medium"}</Badge>
                    </td>

                    {/* Resolution Status Dropdown */}
                    <td className="py-3 px-4">
                      {onUpdateStatus ? (
                        <select
                          value={item.resolution_status || "Open"}
                          onChange={(e) =>
                            onUpdateStatus(item.id, e.target.value)
                          }
                          aria-label={`Update status for ${item.issue_key}`}
                          className={`bg-[#0b0f19] border rounded px-2 py-1 text-xs font-medium cursor-pointer transition-colors ${
                            item.resolution_status === "Resolved" ||
                            item.resolution_status === "Closed"
                              ? "text-emerald-300 border-emerald-500/40 bg-emerald-950/20"
                              : item.resolution_status === "In Progress"
                                ? "text-amber-300 border-amber-500/40 bg-amber-950/20"
                                : "text-slate-300 border-slate-700"
                          }`}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      ) : (
                        <Badge size="sm">
                          {item.resolution_status || "Open"}
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEditItem && (
                          <button
                            onClick={() => onEditItem(item)}
                            aria-label={`Edit ${item.issue_key}`}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            aria-label={`Unlink ${item.issue_key}`}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LinkedItemsTable;
