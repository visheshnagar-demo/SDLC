import React, { useState, useEffect } from "react";
import { getDashboardMetrics } from "../services/api";
import {
  Coins,
  Users,
  AlertTriangle,
  ArrowLeftRight,
  RefreshCw,
  Layers,
} from "lucide-react";

export default function Dashboard({ onOpenTransfer }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
      setError(
        "Failed to load dashboard metrics. Ensure backend server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Layers className="w-7 h-7 text-cyan-400" />
            ChipsLedger Pro Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time chip circulation, account metrics, and transactional
            settlement stream
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {onOpenTransfer && (
            <button
              onClick={() => onOpenTransfer("transfer")}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-lg transition"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Quick Transfer
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* KPI Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Circulation</span>
            <Coins className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading
              ? "..."
              : (metrics?.total_circulation ?? 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total active chip face value
          </p>
        </div>

        <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Accounts</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : (metrics?.active_accounts ?? 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accounts with non-zero balance
          </p>
        </div>

        <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {loading ? "..." : (metrics?.low_stock_count ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Batches under threshold</p>
        </div>

        <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>24h Volume</span>
            <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {loading ? "..." : (metrics?.volume_24h ?? 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total chips transferred (24h)
          </p>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
            Recent Transactions
          </h2>
          <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-700">
            Real-time Stream
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Loading recent transactions...
          </div>
        ) : metrics?.recent_transactions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {metrics.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-medium text-cyan-300">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded font-semibold ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {tx.reason || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm bg-slate-900/40 rounded-lg">
            No recent transactions recorded.
          </div>
        )}
      </div>
    </div>
  );
}
