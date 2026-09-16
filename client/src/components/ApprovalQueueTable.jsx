import React, { useState } from "react";

export default function ApprovalQueueTable({
  pendingWires = [],
  activeUser,
  onApprove,
  onReject,
}) {
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleApprove = async (wireId) => {
    setActionLoadingId(wireId);
    try {
      await onApprove(wireId, activeUser);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (wireId) => {
    setActionLoadingId(wireId);
    try {
      await onReject(wireId, activeUser);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-semibold text-slate-900">
            Approval Queue & Pending Transfers
          </h3>
          <p className="text-xs text-slate-500">
            Transfers exceeding $10,000 awaiting dual authorization
          </p>
        </div>
        <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2.5 py-1 rounded-full border border-amber-200">
          {pendingWires.length} Awaiting Review
        </span>
      </div>

      {pendingWires.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          No pending wire transfers in queue.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="p-3">Wire ID</th>
                <th className="p-3">Beneficiary Name</th>
                <th className="p-3">Account Number</th>
                <th className="p-3">Routing Number</th>
                <th className="p-3">Amount ($)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Initiated By</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingWires.map((wire) => {
                const isSelfCreated = wire.createdBy === activeUser;
                const isLoading = actionLoadingId === wire.id;

                return (
                  <tr
                    key={wire.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3 font-mono text-xs font-semibold text-slate-700">
                      #{wire.id.slice(0, 8)}
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {wire.beneficiaryName}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-600">
                      {wire.accountNumber}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-600">
                      {wire.routingNumber}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {formatCurrency(wire.amount)}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                        {wire.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-600">
                      <span
                        className={
                          isSelfCreated ? "font-semibold text-amber-700" : ""
                        }
                      >
                        {wire.createdBy} {isSelfCreated ? "(You)" : ""}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(wire.id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {isLoading ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(wire.id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {isLoading ? "..." : "Reject"}
                      </button>
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
