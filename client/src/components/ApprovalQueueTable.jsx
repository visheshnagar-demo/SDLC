import React from "react";
import { Check, X, ShieldAlert, Clock, ArrowPathIcon } from "lucide-react";

export default function ApprovalQueueTable({
  pendingWires,
  onApprove,
  onReject,
  currentUser,
  isLoading,
  onRefresh,
}) {
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amt);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-slate-100">
            Dual-Control Approval Queue
          </h2>
          <span className="ml-2 bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
            {pendingWires.length} Pending
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Reviewer Persona:{" "}
            <strong className="text-slate-200">{currentUser}</strong>
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Refresh Approval Queue"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2"></div>
            <p>Fetching pending wire transfers...</p>
          </div>
        ) : pendingWires.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">
              No Pending Wires
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no wire transfers awaiting dual-control
              approval. High-value wires (&gt; $10,000) will appear here for
              Checker authorization.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Wire ID</th>
                <th className="py-3.5 px-4">Beneficiary</th>
                <th className="py-3.5 px-4">Account / Routing</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Maker (Created By)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {pendingWires.map((wire) => {
                const isSelfWire = wire.createdBy === currentUser;

                return (
                  <tr
                    key={wire.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {wire.id ? `${wire.id.slice(0, 8)}...` : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {wire.beneficiaryName}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      <div>Acc: {wire.accountNumber}</div>
                      <div className="text-slate-400">
                        RT: {wire.routingNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(wire.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">
                          {wire.createdBy || "Unknown"}
                        </span>
                        {isSelfWire && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                            Your Wire
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        PENDING
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onApprove(wire.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md text-white transition-all flex items-center gap-1 shadow-sm ${
                            isSelfWire
                              ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-amber-400"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                          title={
                            isSelfWire
                              ? "Warning: Self-approval violates Dual Control policy (HTTP 403 Forbidden)"
                              : "Approve Wire Transfer"
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(wire.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1 shadow-sm"
                          title="Reject Wire Transfer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>
            Dual Control Policy: Approver (Checker) cannot be the same user as
            Creator (Maker).
          </span>
        </div>
      </div>
    </div>
  );
}
