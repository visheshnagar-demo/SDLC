import React, { useState, useEffect } from "react";
import {
  getLiveAnalytics,
  getEvents,
  getEventTiers,
  updatePassTier,
  exportAttendeesCsv,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import LiveMetricsGrid from "../components/LiveMetricsGrid";
import GateVelocityChart from "../components/GateVelocityChart";
import PassQuotaTable from "../components/PassQuotaTable";
import {
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  Shield,
  CheckCircle2,
} from "lucide-react";

export const AdminDashboard = () => {
  const { isAdmin, user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [primaryEventId, setPrimaryEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) setIsRefreshing(true);
      setError("");

      // 1. Fetch live metrics
      const analyticsData = await getLiveAnalytics();
      setAnalytics(analyticsData);

      // 2. Fetch events & primary tiers
      const eventList = await getEvents();
      if (eventList && eventList.length > 0) {
        const eventId = eventList[0].id;
        setPrimaryEventId(eventId);
        const tierList = await getEventTiers(eventId);
        setTiers(tierList);
      }
    } catch (err) {
      setError(
        "Failed to fetch real-time analytics. Please verify administrative privileges.",
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // Poll every 15s for live gate metrics
    const interval = setInterval(() => {
      loadData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateTier = async (tierId, updateData) => {
    try {
      setIsUpdatingTier(true);
      setError("");
      await updatePassTier(tierId, updateData);
      setSuccessMsg("Pass tier quotas & pricing updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadData(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update pass tier.");
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await exportAttendeesCsv();
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "text/csv" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `garba_attendee_roster_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export attendee roster CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#BE185D] uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Executive Operations Command Center</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-100 mt-1">
            Admin Analytics & Quota Controls
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time gate occupancy, scan velocity, sales revenue, and
            adjust pass quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#BE185D] to-[#F59E0B] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#BE185D]/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isExporting ? "Generating..." : "Export Attendee Roster (CSV)"}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300 text-xs flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <section>
        <LiveMetricsGrid analytics={analytics} />
      </section>

      {/* Analytics Chart & Quota Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <GateVelocityChart gateMetrics={analytics?.gateMetrics} />
        </div>

        <div>
          <PassQuotaTable
            tiers={tiers}
            onUpdateTier={handleUpdateTier}
            isUpdating={isUpdatingTier}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
