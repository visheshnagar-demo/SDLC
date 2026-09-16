import React from "react";
import { DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function MetricGroup({ wires = [] }) {
  const totalCount = wires.length;
  const pendingCount = wires.filter((w) => w.status === "PENDING").length;
  const approvedCount = wires.filter((w) => w.status === "APPROVED").length;
  const rejectedCount = wires.filter((w) => w.status === "REJECTED").length;

  const totalVolume = wires.reduce(
    (sum, w) => sum + (parseFloat(w.amount) || 0),
    0,
  );

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const metrics = [
    {
      title: "Total Wire Volume",
      value: formatCurrency(totalVolume),
      subtext: `${totalCount} total wires initiated`,
      icon: <DollarSign className="w-5 h-5 text-blue-600" />,
      bgColor: "bg-blue-50 border-blue-100",
    },
    {
      title: "Pending Approvals",
      value: pendingCount,
      subtext: "Requires Dual Control Checker",
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      bgColor: "bg-amber-50 border-amber-100",
    },
    {
      title: "Approved Wires",
      value: approvedCount,
      subtext: "Auto or Checker Approved",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bgColor: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "Rejected Wires",
      value: rejectedCount,
      subtext: "Rejected by Checker",
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      bgColor: "bg-red-50 border-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-xl border ${m.bgColor} shadow-sm bg-white flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {m.title}
            </p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{m.value}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{m.subtext}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            {m.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
