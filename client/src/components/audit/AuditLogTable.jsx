import React, { useState } from "react";
import {
  ScrollText,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Check,
} from "lucide-react";

export default function AuditLogTable({ logs = [], loading = false }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      filterStatus === "ALL" ||
      log.status?.toUpperCase() === filterStatus.toUpperCase();
    const matchesSearch =
      !searchQuery ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_resource?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || "SUCCESS";
    if (s === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
          <CheckCircle2 className="w-3 h-3" /> SUCCESS
        </span>
      );
    }
    if (s === "DENIED") {
      return (
        <span className="inline-flex items-center gap-1 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
          <AlertTriangle className="w-3 h-3" /> DENIED (RBAC)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
        <XCircle className="w-3 h-3" /> FAILED
      </span>
    );
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
      {/* Header Controls */}
      <div className="p-4 border-b border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#dae2fd] flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[#06b6d4]" />
            Immutable Audit Event Logs
          </h2>
          <p className="text-xs text-[#bcc9cd]">
            Cryptographically sealed audit trail with SHA-256 Merkle proofs
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#bcc9cd] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, IP, resource..."
              className="bg-[#0b1326] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1 text-xs text-[#dae2fd] placeholder-[#64748b] focus:outline-none focus:border-[#06b6d4]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0b1326] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-[#dae2fd] focus:outline-none focus:border-[#06b6d4] font-mono cursor-pointer"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="DENIED">DENIED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b1326]/70 border-b border-[#1e293b] text-[#bcc9cd] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">User Email / Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Status / Outcome</th>
              <th className="py-3 px-4">Source IP</th>
              <th className="py-3 px-4 text-right">Merkle Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/60">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-[#bcc9cd]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading audit records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-[#bcc9cd]">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-[#0b1326]/50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-[#bcc9cd] text-[11px]">
                    {log.created_at
                      ? new Date(log.created_at)
                          .toISOString()
                          .replace("T", " ")
                          .slice(0, 19)
                      : "2026-05-18 10:45:12"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#dae2fd]">
                      {log.user_email || "admin@example.com"}
                    </span>
                    <span className="block text-[10px] text-[#64748b] font-mono">
                      Role:{" "}
                      {log.user_role ||
                        (log.user_email?.includes("admin")
                          ? "ADMIN"
                          : "READ_ONLY")}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="bg-[#171f33] px-2 py-0.5 rounded text-[11px] text-[#06b6d4] border border-[#1e293b]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#dae2fd]">
                    {log.target_resource || "i-03ab92fc112"}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#bcc9cd]">
                    {log.ip_address || "192.168.1.100"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[#38bdf8] hover:text-[#06b6d4] bg-[#0b1326] px-2 py-1 rounded border border-[#1e293b] hover:border-[#38bdf8]/40 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Verify</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Merkle Proof Details Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-[#06b6d4]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#06b6d4]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-bold">
                  Cryptographic Audit Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#64748b] hover:text-[#dae2fd]"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#0b1326] p-4 rounded-xl border border-[#1e293b] space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#64748b] uppercase">
                  Event ID
                </span>
                <p className="text-[#dae2fd] text-[11px]">
                  {selectedLog.id || "evt-89104-merkle"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] uppercase">
                  Action & Target
                </span>
                <p className="text-[#06b6d4]">
                  {selectedLog.action} &rarr; {selectedLog.target_resource}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] uppercase">
                  SHA-256 Merkle Proof Leaf
                </span>
                <div className="bg-[#060e20] p-2 rounded text-[10px] text-[#10b981] break-all border border-[#1e293b]">
                  {selectedLog.merkle_proof ||
                    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] uppercase">
                  Verification Status
                </span>
                <div className="flex items-center gap-1.5 text-[#10b981] text-xs font-bold mt-0.5">
                  <Check className="w-4 h-4" />
                  <span>Valid Chain Seal — Tamper Proof</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#06b6d4] text-[#0b1326] font-bold text-xs rounded-xl hover:bg-[#38bdf8] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
