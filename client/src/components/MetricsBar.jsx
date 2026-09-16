import React from "react";
import { Clock, CheckCircle2, Send, ShieldAlert } from "lucide-react";

export const MetricsBar = ({ pendingWires = [], autoApprovedCount = 0 }) => {
  const pendingTotal = pendingWires.reduce(
    (sum, w) => sum + (Number(w.amount) || 0),
    0,
  );
  const pendingCount = pendingWires.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Pending Approval Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Pending Approval (&gt; $10k)
            </p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            $
            {pendingTotal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div>
          <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {pendingCount} {pendingCount === 1 ? "PENDING" : "PENDING"}
          </span>
        </div>
      </div>

      {/* Auto-Approved Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Auto-Approved Today (≤ $10k)
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            Threshold Routing
          </p>
        </div>
        <div>
          <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            {autoApprovedCount} Auto-Approved Session
          </span>
        </div>
      </div>

      {/* Total Initiated Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Threshold Policy
            </p>
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            $10,000.00 Limit
          </p>
        </div>
        <div>
          <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Automated Rules Active
          </span>
        </div>
      </div>

      {/* Segregation Policy Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Segregation Policy
            </p>
            <ShieldAlert className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            Dual Control Active
          </p>
        </div>
        <div>
          <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            SOX Compliant
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetricsBar;
