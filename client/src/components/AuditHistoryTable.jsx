import React from "react";

export default function AuditHistoryTable({ wires = [] }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      return new Date(isoStr).toLocaleString();
    } catch {
      return isoStr;
    }
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-semibold text-slate-900">
            Wire Transfer Historical Audit Log
          </h3>
          <p className="text-xs text-slate-500">
            Complete audit trail of all wire transactions
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded">
          Total Records: {wires.length}
        </span>
      </div>

      {wires.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          No wire transfers recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="p-3">Wire Ref</th>
                <th className="p-3">Beneficiary</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Maker ID</th>
                <th className="p-3">Checker ID</th>
                <th className="p-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {wires.map((wire) => (
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
                  <td className="p-3 font-bold text-slate-900">
                    {formatCurrency(wire.amount)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getBadgeStyle(wire.status)}`}
                    >
                      {wire.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-600 font-medium">
                    {wire.createdBy}
                  </td>
                  <td className="p-3 text-xs text-slate-600 font-medium">
                    {wire.approvedBy || "-"}
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {formatDate(wire.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
