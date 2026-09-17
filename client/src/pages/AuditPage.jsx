import React, { useEffect, useState } from "react";
import AuditTable from "../components/audit/AuditTable";
import AuditInspectorDrawer from "../components/audit/AuditInspectorDrawer";
import { fetchAuditLogs } from "../services/api";
import { RefreshCcw, Download } from "lucide-react";

export const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    const headers = [
      "Log ID",
      "Timestamp",
      "Actor",
      "Action",
      "Entity",
      "SHA256 Hash",
    ];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.actor_name || l.actor_id,
      l.action_type,
      l.entity_name,
      l.sha256_hash,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Immutable Audit Trail & Compliance Ledger
          </h1>
          <p className="text-sm text-slate-400">
            Cryptographically signed append-only audit trail and state diff
            inspector
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Regulatory Report
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all"
          >
            <RefreshCcw
              className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <AuditTable logs={logs} onInspectLog={(log) => setSelectedLog(log)} />

      {selectedLog && (
        <AuditInspectorDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default AuditPage;
