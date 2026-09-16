import React from "react";
import { Check, X, Inbox, Clock } from "lucide-react";

export const PendingApprovalQueueTable = ({
  pendingWires = [],
  currentUser,
  onApprove,
  onReject,
  loadingActionId,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> Pending Approval Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Wire transfers over $10,000 awaiting Checker approval. Reviewer:{" "}
            <span className="font-semibold text-slate-700">{currentUser}</span>
          </p>
        </div>
        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
          {pendingWires.length} PENDING
        </span>
      </div>

      {pendingWires.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">
            No Pending Wires
          </p>
          <p className="text-xs text-slate-400 mt-1">
            All wire transfers have been approved or processed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Beneficiary</th>
                <th className="p-3">Account / Routing</th>
                <th className="p-3">Amount ($ USD)</th>
                <th className="p-3">Maker (Creator)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingWires.map((wire) => {
                const isMakerSelf = wire.createdBy === currentUser;
                const isLoading = loadingActionId === wire.id;

                return (
                  <tr
                    key={wire.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-900">
                      {wire.beneficiaryName}
                    </td>
                    <td className="p-3 text-xs text-slate-600 font-mono">
                      <div>Acc: {wire.accountNumber}</div>
                      <div className="text-slate-400">
                        ABA: {wire.routingNumber}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-blue-700 font-mono text-base">
                      $
                      {Number(wire.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-3 text-xs text-slate-700">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          isMakerSelf
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {wire.createdBy}
                        {isMakerSelf && " (You)"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        {wire.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onApprove(wire.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          title={
                            isMakerSelf
                              ? "Self-approval will be rejected by Segregation of Duties"
                              : "Approve Wire"
                          }
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => onReject(wire.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          title="Reject Wire"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
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

export default PendingApprovalQueueTable;
