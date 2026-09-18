import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  CheckCircle,
  ShieldAlert,
  Users,
  Layers,
  PieChart,
  ArrowRight,
} from "lucide-react";
import StatCard from "../components/StatCard";
import { getDashboardAnalytics } from "../services/api";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.warn("Dashboard API error, rendering fallback state", err);
      setError(
        "Unable to load live telemetry from backend. Showing baseline estimates.",
      );
      setAnalytics({
        total_devices: 42,
        active_assignments: 28,
        available_devices: 10,
        non_compliant_count: 4,
        os_distribution: { iOS: 24, Android: 18 },
        ownership_distribution: { Corporate: 30, BYOD: 12 },
      });
    } finally {
      setLoading(false);
    }
  };

  const total = analytics?.total_devices || 0;
  const active = analytics?.active_assignments || 0;
  const available = analytics?.available_devices || 0;
  const nonCompliant = analytics?.non_compliant_count || 0;
  const complianceRate =
    total > 0 ? Math.round(((total - nonCompliant) / total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mobile Fleet Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, compliance posture, and inventory status
          </p>
        </div>

        <Link
          to="/devices"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <span>Manage Devices</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
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

      {/* OS & Ownership Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OS Breakdown */}
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

        {/* Ownership Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-200 dark:border-slate-700">
            <Layers className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ownership Type Distribution
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Corporate-Owned Assets</span>
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
                <span>BYOD (Employee-Owned)</span>
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
