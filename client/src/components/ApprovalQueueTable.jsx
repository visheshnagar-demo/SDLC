import React from "react";
import { Check, X, ShieldAlert, RefreshCw, Clock } from "lucide-react";

export function ApprovalQueueTable({
  pendingWires,
  activeUser,
  onApprove,
  onReject,
  onRefresh,
  loading,
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Checker Approval Queue (&gt; $10,000 Threshold)
          </h2>
          <p className="text-xs text-slate-400">
            Pending dual authorization. Maker-Checker policy enforces
            independent Checker approval.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          title="Refresh Queue"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="p-3.5">Transfer ID</th>
              <th className="p-3.5">Beneficiary</th>
              <th className="p-3.5">Account No.</th>
              <th className="p-3.5">Routing No.</th>
              <th className="p-3.5">Amount (USD)</th>
              <th className="p-3.5">Created By</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {pendingWires.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Clock className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-sm">
                      No Pending Wire Approvals
                    </p>
                    <p className="text-xs text-slate-400">
                      All initiated wire transfers over $10,000 have been
                      processed.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pendingWires.map((wire) => {
                const isCreator = wire.createdBy === activeUser;

                return (
                  <tr
                    key={wire.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCreator ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="p-3.5 font-mono font-medium text-slate-900">
                      {wire.id}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {wire.beneficiaryName}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {wire.accountNumber}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {wire.routingNumber}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                      $
                      {Number(wire.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        {wire.createdBy}
                        {isCreator && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-300">
                            YOU (MAKER)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        PENDING
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => onApprove(wire.id)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                        title={
                          isCreator
                            ? "Self-approval will be rejected with 403 Forbidden"
                            : "Approve Wire"
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(wire.id)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                        title="Reject Wire"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>
          Active Checker Session:{" "}
          <strong className="text-slate-800">{activeUser}</strong>
        </span>
        <span>Displaying {pendingWires.length} pending wire request(s)</span>
      </div>
    </div>
  );
}

export default ApprovalQueueTable;
