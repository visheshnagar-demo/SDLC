import React from "react";

export default function ApprovalQueue({
  pendingWires,
  onApprove,
  onReject,
  activeUser,
  isLoading,
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Pending Approval Queue
          </h2>
          <p className="text-xs text-slate-500">
            Review high-value wire transfer requests (&gt; $10,000) awaiting
            Checker authorization.
          </p>
        </div>
        <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded font-medium">
          Active User: <span className="font-bold">{activeUser}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500 font-medium">
          Loading pending wire transfers...
        </div>
      ) : !pendingWires || pendingWires.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded border border-dashed border-slate-200">
          No pending wire transfers requiring approval at this time.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="p-3">Wire ID</th>
                <th className="p-3">Beneficiary</th>
                <th className="p-3">Account Number</th>
                <th className="p-3">Routing Number</th>
                <th className="p-3">Amount ($)</th>
                <th className="p-3">Created By (Maker)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pendingWires.map((wire) => {
                const isSelfCreated = wire.createdBy === activeUser;

                return (
                  <tr
                    key={wire.id}
                    className={`hover:bg-slate-50 transition-colors ${isSelfCreated ? "bg-amber-50/20" : ""}`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {wire.id}
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {wire.beneficiaryName}
                    </td>
                    <td className="p-3 font-mono">{wire.accountNumber}</td>
                    <td className="p-3 font-mono">{wire.routingNumber}</td>
                    <td className="p-3 font-bold text-slate-900">
                      {formatCurrency(wire.amount)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100">
                        {wire.createdBy}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => onApprove(wire.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded transition-colors shadow-sm text-xs"
                        title={
                          isSelfCreated
                            ? "Warning: Attempting self-approval will trigger 403 Forbidden"
                            : "Approve wire transfer"
                        }
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(wire.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded transition-colors shadow-sm text-xs"
                        title="Reject wire transfer"
                      >
                        Reject
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
