import React from "react";
import StatCard from "./StatCard";
import {
  Smartphone,
  Users,
  Layers,
  ShieldAlert,
  CheckCircle,
  PieChart,
} from "lucide-react";

export default function Dashboard({ analytics, loading, error }) {
  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading analytics dashboard...
      </div>
    );
  }

  const total = analytics?.total_devices || 0;
  const active = analytics?.active_assignments || 0;
  const available = analytics?.available_devices || 0;
  const nonCompliant = analytics?.non_compliant_count || 0;
  const complianceRate =
    total > 0 ? Math.round(((total - nonCompliant) / total) * 100) : 100;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mobile Assets"
          value={total}
          subtext="Enrolled mobile devices"
          icon={Smartphone}
          color="blue"
        />
        <StatCard
          title="Active Assignments"
          value={active}
          subtext={`${active} assigned to employees`}
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Unassigned Inventory"
          value={available}
          subtext="Available in depot"
          icon={Layers}
          color="amber"
        />
        <StatCard
          title="Compliance Posture"
          value={`${complianceRate}%`}
          subtext={`${nonCompliant} non-compliant alerts`}
          icon={nonCompliant > 0 ? ShieldAlert : CheckCircle}
          color={nonCompliant > 0 ? "rose" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-200 dark:border-slate-700">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Operating System Breakdown
            </h2>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Apple iOS</span>
                <span>{analytics?.os_distribution?.iOS || 0} Devices</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width:
                      total > 0
                        ? `${((analytics?.os_distribution?.iOS || 0) / total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Google Android</span>
                <span>{analytics?.os_distribution?.Android || 0} Devices</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width:
                      total > 0
                        ? `${((analytics?.os_distribution?.Android || 0) / total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-200 dark:border-slate-700">
            <Layers className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ownership Distribution
            </h2>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Corporate Owned</span>
                <span>
                  {analytics?.ownership_distribution?.Corporate || 0} Devices
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width:
                      total > 0
                        ? `${((analytics?.ownership_distribution?.Corporate || 0) / total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>BYOD (Personal)</span>
                <span>
                  {analytics?.ownership_distribution?.BYOD || 0} Devices
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width:
                      total > 0
                        ? `${((analytics?.ownership_distribution?.BYOD || 0) / total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
