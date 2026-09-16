import React from "react";

export default function MetricCards({
  pendingCount,
  autoApprovedCount,
  totalVolume,
}) {
  const formattedVolume = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalVolume || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Total Wires Volume
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1">
          {formattedVolume}
        </p>
        <p className="text-xs text-emerald-600 font-medium mt-1">
          Commercial Transfers
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Pending Dual Approval
        </p>
        <p className="text-2xl font-bold text-amber-600 mt-1">
          {pendingCount} Wires
        </p>
        <p className="text-xs text-amber-700 font-medium mt-1">
          &gt; $10,000 Threshold
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Auto-Approved Wires
        </p>
        <p className="text-2xl font-bold text-emerald-600 mt-1">
          {autoApprovedCount} Wires
        </p>
        <p className="text-xs text-emerald-700 font-medium mt-1">
          &le; $10,000 Threshold
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Dual Control Policy
        </p>
        <p className="text-2xl font-bold text-blue-900 mt-1">Active</p>
        <p className="text-xs text-blue-700 font-medium mt-1">
          SoD Enforced (403 Error on Self-Approval)
        </p>
      </div>
    </div>
  );
}
