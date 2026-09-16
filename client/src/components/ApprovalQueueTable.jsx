import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  User,
  DollarSign,
} from "lucide-react";

export default function ApprovalQueueTable({
  pendingWires = [],
  currentUser,
  onApprove,
  onReject,
  onRefresh,
  isLoading = false,
  actionLoadingId = null,
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header / Action Bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Pending Approval Queue
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
              {pendingWires.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Wire transfers over $10,000 awaiting independent Checker approval
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {isLoading && pendingWires.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading pending wire transfers...
          </div>
        ) : pendingWires.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">
              No Pending Wire Transfers
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              All high-value wire transfers have been processed or no pending
              requests exist.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Wire ID</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Account / Routing</th>
                <th className="py-3 px-4 text-right">Amount ($ USD)</th>
                <th className="py-3 px-4">Created By (Maker)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {pendingWires.map((wire) => {
                const isSelfCreated = wire.createdBy === currentUser;
                const isActionLoading = actionLoadingId === wire.id;

                return (
                  <tr
                    key={wire.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelfCreated ? "bg-amber-50/30" : ""
                    }`}
                  >
                    {/* Wire ID */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 font-medium">
                      {wire.id ? wire.id.substring(0, 8) : "N/A"}...
                    </td>

                    {/* Beneficiary */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {wire.beneficiaryName}
                    </td>

                    {/* Account / Routing */}
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-mono">
                      <div>Acc: {wire.accountNumber}</div>
                      <div className="text-slate-400">
                        RT: {wire.routingNumber}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 font-mono">
                      {formatCurrency(wire.amount)}
                    </td>

                    {/* Created By */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">
                          {wire.createdBy}
                        </span>
                      </div>
                      {isSelfCreated && (
                        <div className="text-[10px] text-amber-700 font-medium flex items-center gap-0.5 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Self-created (Approval blocked)</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 mr-1 text-amber-600" />
                        PENDING
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Approve Button */}
                        <button
                          onClick={() => onApprove(wire.id)}
                          disabled={isActionLoading || isLoading}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition disabled:opacity-50 shadow-sm"
                          title={
                            isSelfCreated
                              ? "Attempting to approve self-created wire will return 403 error"
                              : "Approve Wire"
                          }
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          onClick={() => onReject(wire.id)}
                          disabled={isActionLoading || isLoading}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition disabled:opacity-50 shadow-sm"
                          title="Reject Wire"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
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
    </div>
  );
}
