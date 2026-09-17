import React from "react";
import { Coins, Users, AlertTriangle, TrendingUp } from "lucide-react";

export const KPICards = ({ stats }) => {
  const data = stats || {
    total_circulation: 4850000,
    active_accounts: 1240,
    low_stock_count: 2,
    volume_24h: 348500,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Circulation
            </span>
            <div className="text-3xl font-extrabold text-white mt-1 font-mono">
              {Number(data.total_circulation).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Chips across all active vaults
            </p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <Coins className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-b-xl opacity-80" />
      </div>

      <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Balances
            </span>
            <div className="text-3xl font-extrabold text-white mt-1 font-mono">
              {Number(data.active_accounts).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Registered active accounts
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-b-xl opacity-80" />
      </div>

      <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">
              {data.low_stock_count} Batches
            </div>
            <p className="text-xs text-amber-400/80 mt-2">
              Requires stock replenishment
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-b-xl opacity-80" />
      </div>

      <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              24h Volume
            </span>
            <div className="text-3xl font-extrabold text-purple-400 mt-1 font-mono">
              {Number(data.volume_24h).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Settled transactions today
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-b-xl opacity-80" />
      </div>
    </div>
  );
};

export default KPICards;
