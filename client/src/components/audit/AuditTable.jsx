import React, { useState } from "react";
import { FileText, Search, Eye, Key } from "lucide-react";

export const AuditTable = ({ logs, onInspectLog }) => {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const rawLogs = logs || [
    {
      id: "LOG-882190-01",
      timestamp: new Date().toISOString(),
      actor_id: "acc-002",
      actor_name: "Alice Admin",
      action_type: "TRANSFER",
      entity_name: "Transaction",
      entity_id: "tx-101",
      ip_address: "192.168.1.45",
      before_state: { balance_a: 500000, balance_b: 100000 },
      after_state: { balance_a: 499500, balance_b: 100500 },
      sha256_hash:
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    {
      id: "LOG-882190-02",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      actor_id: "acc-001",
      actor_name: "System Vault",
      action_type: "BATCH_ALLOCATION",
      entity_name: "InventoryBatch",
      entity_id: "batch-2026-001",
      ip_address: "10.0.0.1",
      before_state: { total_quantity: 0 },
      after_state: { total_quantity: 10000 },
      sha256_hash:
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    },
  ];

  const filteredLogs = rawLogs.filter((item) => {
    const matchSearch =
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.action_type.toLowerCase().includes(search.toLowerCase());
    const matchAction =
      filterAction === "ALL" || item.action_type === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-6 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Immutable Audit Trail Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Cryptographically verifiable, append-only transaction log
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Log ID, Actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Actions</option>
            <option value="TRANSFER">Transfer</option>
            <option value="BATCH_ALLOCATION">Batch Allocation</option>
            <option value="REDEEM">Redeem</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
              <th className="py-3 px-4">Log ID</th>
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action Type</th>
              <th className="py-3 px-4">SHA-256 Hash</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-mono text-slate-200">
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3.5 px-4 font-bold text-cyan-400">
                  {log.id}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-300">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-3.5 px-4 font-sans font-semibold text-white">
                  {log.actor_name || log.actor_id}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {log.action_type}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-400 font-mono truncate max-w-[140px]">
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Key className="w-3 h-3 text-cyan-400" />
                    {log.sha256_hash?.substring(0, 12)}...
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => onInspectLog && onInspectLog(log)}
                    className="p-1.5 bg-slate-700 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 rounded-lg transition-all"
                    title="Inspect State Diff & Hash"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;
