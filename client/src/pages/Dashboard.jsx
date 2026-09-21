import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bird,
  Egg,
  Package,
  Activity,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import {
  getFlocks,
  getEggCollections,
  getFeedInventory,
  getHealthLogs,
} from "../services/api";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [flocks, setFlocks] = useState([]);
  const [eggCollections, setEggCollections] = useState([]);
  const [feedInventory, setFeedInventory] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [flocksRes, eggRes, feedRes, healthRes] = await Promise.all([
          getFlocks(),
          getEggCollections(),
          getFeedInventory(),
          getHealthLogs(),
        ]);
        setFlocks(flocksRes || []);
        setEggCollections(eggRes || []);
        setFeedInventory(feedRes || []);
        setHealthLogs(healthRes || []);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute live KPI metrics
  const activeFlocks = flocks.filter((f) => f.status === "Active");
  const totalActiveHens = activeFlocks.reduce(
    (sum, f) => sum + (f.active_count || 0),
    0,
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCollections = eggCollections.filter(
    (c) => c.collection_date === todayStr,
  );
  const todayEggTotal = todayCollections.reduce(
    (sum, c) => sum + (c.total_count || 0),
    0,
  );

  // Business Rule: Flocks with 0 active hens report 0.0% laying rate without division by zero error
  const layingRate =
    totalActiveHens > 0
      ? ((todayEggTotal / totalActiveHens) * 100).toFixed(1)
      : "0.0";

  const lowStockFeeds = feedInventory.filter(
    (f) => f.quantity_kg <= f.reorder_threshold_kg,
  );

  // Grade Breakdown
  const totalGradeLarge = todayCollections.reduce(
    (sum, c) => sum + (c.grade_large || 0),
    0,
  );
  const totalGradeMedium = todayCollections.reduce(
    (sum, c) => sum + (c.grade_medium || 0),
    0,
  );
  const totalGradeSmall = todayCollections.reduce(
    (sum, c) => sum + (c.grade_small || 0),
    0,
  );
  const totalDamaged = todayCollections.reduce(
    (sum, c) => sum + (c.damaged || 0),
    0,
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Low Stock Banner Notification */}
      {lowStockFeeds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Low Feed Inventory Alert</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockFeeds.map((f) => f.feed_type).join(", ")} is below the
                reorder threshold!
              </p>
            </div>
          </div>
          <Link
            to="/feed-inventory"
            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            Manage Feed
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Hens"
          value={totalActiveHens.toLocaleString()}
          subtext={`${activeFlocks.length} Active Flocks`}
          icon={Bird}
          badgeText="Healthy"
          badgeColor="emerald"
        />

        <StatCard
          title="Today's Egg Yield"
          value={`${todayEggTotal.toLocaleString()} eggs`}
          subtext={`Laying Rate: ${layingRate}%`}
          icon={Egg}
          badgeText={`${layingRate}% Yield`}
          badgeColor={parseFloat(layingRate) >= 80 ? "emerald" : "amber"}
        />

        <StatCard
          title="Feed Stock Status"
          value={`${feedInventory.length} Types`}
          subtext={`${lowStockFeeds.length} Low Stock Alert(s)`}
          icon={Package}
          badgeText={lowStockFeeds.length === 0 ? "Optimal" : "Reorder Needed"}
          badgeColor={lowStockFeeds.length === 0 ? "emerald" : "amber"}
        />

        <StatCard
          title="Health & Mortality"
          value={`${healthLogs.length} Events`}
          subtext="Recent Health Logs"
          icon={Activity}
          badgeText="Monitored"
          badgeColor="indigo"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Egg Production & Quality Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Today's Egg Quality Grading Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Collection yield categorized by size and condition
              </p>
            </div>
            <Link
              to="/egg-collections"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> Log Yield
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-semibold uppercase">
                Grade A Large
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {totalGradeLarge}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                Premium Grade
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-semibold uppercase">
                Grade Medium
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {totalGradeMedium}
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                Standard Size
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-semibold uppercase">
                Grade Small
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {totalGradeSmall}
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                Pullet Yield
              </span>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-lg border border-rose-100 text-center">
              <span className="text-xs text-rose-700 font-semibold uppercase">
                Cracked / Damaged
              </span>
              <div className="text-2xl font-bold text-rose-800 mt-1">
                {totalDamaged}
              </div>
              <span className="text-[10px] text-rose-600 font-medium mt-1 block">
                Loss Rate
              </span>
            </div>
          </div>

          {/* Quick Production Progress Indicator */}
          <div className="pt-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Overall Farm Laying Efficiency Rate</span>
              <span>{layingRate}% Target 85%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(layingRate), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Operational Actions Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Quick Manager Actions
          </h3>

          <div className="space-y-3">
            <Link
              to="/flocks"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-sm font-medium text-slate-800 group"
            >
              <div className="flex items-center gap-3">
                <Bird className="w-5 h-5 text-emerald-600" />
                <span>Register &amp; Manage Flocks</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-emerald-600">
                &rarr;
              </span>
            </Link>

            <Link
              to="/egg-collections"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-sm font-medium text-slate-800 group"
            >
              <div className="flex items-center gap-3">
                <Egg className="w-5 h-5 text-amber-600" />
                <span>Log Daily Egg Yield</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-amber-600">
                &rarr;
              </span>
            </Link>

            <Link
              to="/feed-inventory"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-sm font-medium text-slate-800 group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>Log Feed Distribution</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-indigo-600">
                &rarr;
              </span>
            </Link>

            <Link
              to="/health-logs"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-sm font-medium text-slate-800 group"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-rose-600" />
                <span>Record Mortality &amp; Vaccines</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-rose-600">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
