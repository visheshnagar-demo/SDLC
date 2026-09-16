import React from "react";

export default function MetricsOverview({ wires = [] }) {
  const pendingWires = wires.filter((w) => w.status === "PENDING");
  const approvedWires = wires.filter((w) => w.status === "APPROVED");
  const totalVolume = wires.reduce(
    (acc, w) => acc + (Number(w.amount) || 0),
    0,
  );
  const pendingVolume = pendingWires.reduce(
    (acc, w) => acc + (Number(w.amount) || 0),
    0,
  );

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Total Volume
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1">
          {formatCurrency(totalVolume)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {wires.length} total transfers
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Pending Approvals
        </p>
        <p className="text-2xl font-bold text-amber-600 mt-1">
          {pendingWires.length} Wires
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatCurrency(pendingVolume)} awaiting review
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Auto-Approved Today
        </p>
        <p className="text-2xl font-bold text-emerald-600 mt-1">
          {approvedWires.length} Wires
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Threshold ≤ $10,000</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Dual Approval Limit
        </p>
        <p className="text-2xl font-bold text-blue-600 mt-1">$10,000.00</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Threshold for Checker review
        </p>
      </div>
    </div>
  );
}
