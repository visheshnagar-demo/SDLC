import React from "react";
import { History, FileText } from "lucide-react";

export default function AuditLogTable({ auditLogs = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
        Loading audit log history...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900">
            Stock Adjustment Audit Log
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {auditLogs.length} Records Logged
        </span>
      </div>

      {auditLogs.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          No audit logs recorded yet. Perform a stock adjustment to create
          entries.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Item / SKU</th>
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3 text-right">Delta</th>
                <th className="px-5 py-3 text-right">Prev / New</th>
                <th className="px-5 py-3">Reason Code</th>
                <th className="px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map((log, idx) => {
                const delta = log.quantity_delta ?? log.change ?? 0;
                const isPositive = delta > 0;
                const formattedTime = log.created_at
                  ? new Date(log.created_at).toLocaleString()
                  : new Date().toLocaleString();

                return (
                  <tr
                    key={log.id || idx}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">
                      {log.sku || log.item_id?.substring(0, 8) || "N/A"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {log.warehouse_name ||
                        log.warehouse_id?.substring(0, 8) ||
                        "Main"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`font-semibold text-xs px-2 py-0.5 rounded ${
                          isPositive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-red-800"
                        }`}
                      >
                        {isPositive ? `+${delta}` : delta}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500 font-mono">
                      {log.previous_quantity ?? 0} &rarr;{" "}
                      {log.new_quantity ?? 0}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-700">
                      {log.reason_code || "MANUAL"}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {log.notes || "-"}
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
}
