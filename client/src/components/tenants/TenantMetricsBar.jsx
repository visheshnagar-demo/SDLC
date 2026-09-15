import React from "react";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
} from "lucide-react";

export default function TenantMetricsBar({ tenants = [], total = 0 }) {
  const activeCount = tenants.filter((t) => t.status === "Active").length;
  const suspendedCount = tenants.filter((t) => t.status === "Suspended").length;
  const deactivatedCount = tenants.filter(
    (t) => t.status === "Deactivated",
  ).length;

  const metrics = [
    {
      title: "Total Tenants",
      value: total || tenants.length,
      icon: Building2,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      title: "Active Tenants",
      value: activeCount,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Suspended",
      value: suspendedCount,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Deactivated",
      value: deactivatedCount,
      icon: XCircle,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${metric.borderColor} bg-slate-900/60 backdrop-blur flex items-center justify-between shadow-sm`}
          >
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {metric.title}
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {metric.value}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <Icon className={`w-6 h-6 ${metric.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
