import React from "react";
import {
  Download,
  Calendar,
  Key,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Inbox,
  CreditCard,
} from "lucide-react";
import { historyService } from "../services/api";

export default function AuditHistoryDataTable({
  visits = [],
  total = 0,
  skip = 0,
  limit = 20,
  loading = false,
  error = "",
  filters = {},
  onPageChange,
  onExport,
}) {
  const handleDownloadCsv = async () => {
    try {
      if (onExport) {
        onExport();
        return;
      }
      const blob = await historyService.exportCsv(filters);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "text/csv" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `visitor_audit_log_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("CSV Export failed: " + err.message);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Action Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Audit Records ({total} total entries)
          </span>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          Export CSV Report
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            Querying audit history logs...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 m-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      ) : visits.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            No Visitor Logs Found
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Try resetting date or status filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Visitor & Company</th>
                <th className="py-3 px-4">Pass & Badge</th>
                <th className="py-3 px-4">Designated Host</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Check-In / Out</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((visit) => {
                const visitor = visit.visitor || {};
                const host = visit.host || {};
                const sched = visit.scheduled_start_time
                  ? new Date(visit.scheduled_start_time).toLocaleString(
                      undefined,
                      {
                        dateStyle: "short",
                        timeStyle: "short",
                      },
                    )
                  : "—";
                const checkIn = visit.check_in_time
                  ? new Date(visit.check_in_time).toLocaleTimeString(
                      undefined,
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : null;
                const checkOut = visit.check_out_time
                  ? new Date(visit.check_out_time).toLocaleTimeString(
                      undefined,
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : null;

                return (
                  <tr
                    key={visit.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {visitor.full_name || "Guest"}
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center">
                        <Building className="w-3 h-3 mr-1 text-slate-400" />
                        {visitor.company || "Independent"} ({visitor.email})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {visit.pass_code ? (
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[11px]">
                            {visit.pass_code}
                          </span>
                          {visit.badge_id && (
                            <div className="text-[10px] text-slate-500 flex items-center">
                              <CreditCard className="w-3 h-3 mr-1 text-slate-400" />
                              Badge: #{visit.badge_id}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {host.full_name || "Staff"}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {host.department || host.email}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {visit.purpose}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {sched}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {checkIn ? (
                        <div className="text-[11px]">
                          <span className="text-emerald-700 font-medium">
                            In: {checkIn}
                          </span>
                          {checkOut ? (
                            <span className="text-slate-500 block">
                              Out: {checkOut}
                            </span>
                          ) : (
                            <span className="text-emerald-500 block font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Not Checked In
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          visit.status === "CHECKED_IN"
                            ? "bg-emerald-100 text-emerald-800"
                            : visit.status === "CHECKED_OUT"
                              ? "bg-slate-100 text-slate-700"
                              : visit.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : visit.status === "PENDING_APPROVAL"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {visit.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing{" "}
          <span className="font-bold">{visits.length ? skip + 1 : 0}</span> to{" "}
          <span className="font-bold">{Math.min(skip + limit, total)}</span> of{" "}
          <span className="font-bold">{total}</span> records
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={skip === 0 || loading}
            onClick={() =>
              onPageChange && onPageChange(Math.max(0, skip - limit))
            }
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={skip + limit >= total || loading}
            onClick={() => onPageChange && onPageChange(skip + limit)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
