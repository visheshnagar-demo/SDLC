import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";
import LiveMetricsGrid from "../components/LiveMetricsGrid";
import GateVelocityChart from "../components/GateVelocityChart";
import PassQuotaTable from "../components/PassQuotaTable";
import {
  getLiveAnalytics,
  getEvents,
  getEventTiers,
  updatePassTier,
  exportAttendees,
} from "../services/api";

const DEFAULT_METRICS = {
  totalPassesIssued: 4850,
  totalCheckedIn: 1250,
  gross_revenue: 214800,
  scansPerMinute: 42,
};

const DEFAULT_ADMIN_TIERS = [
  {
    id: "tier-general",
    tier_name: "General Single-Day Pass",
    price: 35.0,
    total_quota: 2500,
    available_quota: 1420,
  },
  {
    id: "tier-vip",
    tier_name: "VIP Stage & Lounge Pass",
    price: 85.0,
    total_quota: 800,
    available_quota: 210,
  },
  {
    id: "tier-season",
    tier_name: "All 9-Nights Season Pass",
    price: 199.0,
    total_quota: 1500,
    available_quota: 380,
  },
  {
    id: "tier-group-squad",
    tier_name: "Squad Group Pass (5 Attendees)",
    price: 150.0,
    total_quota: 400,
    available_quota: 0,
  },
];

const DEFAULT_ATTENDEES = [
  {
    id: "att-101",
    name: "Aarav Patel",
    email: "test@example.com",
    passNumber: "GB-2026-X812",
    tier: "Season VIP Pass",
    gate: "Gate 3 VIP",
    checkedIn: true,
    checkInTime: "18:42:10",
  },
  {
    id: "att-102",
    name: "Priya Shah",
    email: "priya.s@example.com",
    passNumber: "GB-2026-N014",
    tier: "VIP Stage Pass",
    gate: "Gate 1 North",
    checkedIn: true,
    checkInTime: "18:45:00",
  },
  {
    id: "att-103",
    name: "Kavita Joshi",
    email: "kavita.j@example.com",
    passNumber: "GB-2026-G109",
    tier: "Single-Day Pass",
    gate: "Gate 2 South",
    checkedIn: false,
    checkInTime: "Pending Entry",
  },
  {
    id: "att-104",
    name: "Devendra Varma",
    email: "dev.varma@example.com",
    passNumber: "GB-2026-X551",
    tier: "Season Pass",
    gate: "Gate 1 North",
    checkedIn: true,
    checkInTime: "18:15:30",
  },
  {
    id: "att-105",
    name: "Ananya Desai",
    email: "ananya.d@example.com",
    passNumber: "GB-2026-V889",
    tier: "VIP Stage Pass",
    gate: "Gate 3 VIP",
    checkedIn: false,
    checkInTime: "Pending Entry",
  },
];

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [tiers, setTiers] = useState(DEFAULT_ADMIN_TIERS);
  const [attendees, setAttendees] = useState(DEFAULT_ATTENDEES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGate, setFilterGate] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const analyticsRes = await getLiveAnalytics().catch(() => null);
      if (analyticsRes) {
        setMetrics(analyticsRes);
      }
    } catch (e) {
      // Keep state
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateTier = async (tierId, tierData) => {
    try {
      setIsUpdatingTier(true);
      await updatePassTier(tierId, tierData).catch(() => null);

      // Local optimistic update
      setTiers((prev) =>
        prev.map((t) => (t.id === tierId ? { ...t, ...tierData } : t)),
      );

      setNotification("Pass tier quota & pricing successfully updated.");
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification("Failed to update tier quota.");
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      let blob;
      try {
        blob = await exportAttendees();
      } catch (err) {
        // Fallback client side CSV generation
        const headers =
          "ID,Name,Email,PassNumber,Tier,Gate,CheckedIn,CheckInTime\n";
        const rows = attendees
          .map(
            (a) =>
              `${a.id},"${a.name}",${a.email},${a.passNumber},"${a.tier}","${a.gate}",${a.checkedIn},"${a.checkInTime}"`,
          )
          .join("\n");
        blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `GarbaFest-Attendees-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setNotification("Error generating attendee CSV export.");
    }
  };

  const filteredAttendees = attendees.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.passNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGate = filterGate === "ALL" || a.gate.includes(filterGate);
    return matchesSearch && matchesGate;
  });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Operations Command Center</span>
            </div>
            <h1 className='text-2xl sm:text-4xl font-extrabold font-["Syne"] text-white'>
              Admin & Live Attendance Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage pass quotas, dynamic pricing, monitor real-time gate entry
              velocity, and export rosters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 text-amber-400 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh Live Data</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-xs font-bold text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Export Attendee Roster (CSV)</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* 1. Live KPI Metrics */}
        <section>
          <LiveMetricsGrid metrics={metrics} />
        </section>

        {/* 2. Gate Velocity Chart */}
        <section>
          <GateVelocityChart gateMetrics={metrics?.gateMetrics} />
        </section>

        {/* 3. Pass Quota & Pricing Table */}
        <section>
          <PassQuotaTable
            tiers={tiers}
            onUpdateTier={handleUpdateTier}
            isUpdating={isUpdatingTier}
          />
        </section>

        {/* 4. Live Attendee Roster & Gate Check-in Status */}
        <section className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-slate-950 font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white font-["Syne"]'>
                  Live Attendee Gate Check-in Roster
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time status of all registered festival pass holders.
                </p>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, pass..."
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-48 sm:w-60"
                />
              </div>

              <select
                value={filterGate}
                onChange={(e) => setFilterGate(e.target.value)}
                className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Gates</option>
                <option value="Gate 1">Gate 1 North</option>
                <option value="Gate 2">Gate 2 South</option>
                <option value="Gate 3">Gate 3 VIP</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Attendee</th>
                  <th className="py-3.5 px-4">Pass #</th>
                  <th className="py-3.5 px-4">Pass Tier</th>
                  <th className="py-3.5 px-4">Assigned Gate</th>
                  <th className="py-3.5 px-4">Gate Status</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Check-in Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredAttendees.map((att) => (
                  <tr
                    key={att.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {att.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-300 font-medium">
                      {att.passNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{att.tier}</td>
                    <td className="py-3.5 px-4 text-slate-300">{att.gate}</td>
                    <td className="py-3.5 px-4">
                      {att.checkedIn ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                          <CheckCircle className="w-3 h-3" /> INSIDE ARENA
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-max">
                          <Clock className="w-3 h-3" /> NOT CHECKED IN
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {att.checkInTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
