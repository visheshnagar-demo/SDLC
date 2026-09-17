import React, { useEffect, useState } from "react";
import KPICards from "../components/dashboard/KPICards";
import QuickTransferForm from "../components/dashboard/QuickTransferForm";
import { fetchDashboardAnalytics, fetchAuditLogs } from "../services/api";
import { Activity, RefreshCcw } from "lucide-react";

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const analyticsData = await fetchDashboardAnalytics();
      setStats(analyticsData);
      const logsData = await fetchAuditLogs({ limit: 5 });
      setRecentLogs(logsData);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            ChipsLedger Control Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time chip circulation, stock monitoring, and quick settlement
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all"
        >
          <RefreshCcw
            className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Metrics
        </button>
      </div>

      <KPICards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <QuickTransferForm onTransferSuccess={loadData} />
        </div>

        <div className="lg:col-span-5 bg-slate-800/90 rounded-xl border border-slate-700/80 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/80">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">
                Recent Ledger Stream
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {recentLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-cyan-400">
                      {log.action_type}
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      {log.actor_name || log.actor_id}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">
                      COMPLETED
                    </span>
                    <div className="text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/80 text-center">
            <span className="text-xs text-slate-400 font-mono">
              Pessimistic Row Locking Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
