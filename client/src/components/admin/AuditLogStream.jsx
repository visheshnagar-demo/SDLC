import React, { useState, useEffect } from "react";
import { auditApi } from "../../services/api";
import {
  ShieldAlert,
  Lock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
} from "lucide-react";
import Badge from "../common/Badge";

export const AuditLogStream = () => {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const defaultLogs = [
    {
      id: "aud-9901",
      timestamp: "2026-10-07T11:45:12Z",
      user_email: "dr.smith@example.com",
      user_role: "DOCTOR",
      action: "READ_EHR",
      resource_type: "EHRRecord",
      resource_id: "ehr-rec-4912",
      ip_address: "192.168.1.104",
      status: "SUCCESS",
      detail: "Viewed longitudinal medical history & allergy profile",
    },
    {
      id: "aud-9902",
      timestamp: "2026-10-07T11:42:08Z",
      user_email: "unauthorized_agent@external.net",
      user_role: "GUEST",
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      resource_type: "EHRRecord",
      resource_id: "ehr-rec-4912",
      ip_address: "203.0.113.88",
      status: "BLOCKED",
      detail:
        "HTTP 403 Forbidden: Attempted unauthorized read on PHI clinical notes",
    },
    {
      id: "aud-9903",
      timestamp: "2026-10-07T11:30:45Z",
      user_email: "dr.smith@example.com",
      user_role: "DOCTOR",
      action: "CREATE_PRESCRIPTION",
      resource_type: "EHRRecord",
      resource_id: "rx-cardio-991",
      ip_address: "192.168.1.104",
      status: "SUCCESS",
      detail: "Issued e-prescription for Lisinopril 10mg (30-day supply)",
    },
    {
      id: "aud-9904",
      timestamp: "2026-10-07T10:15:33Z",
      user_email: "reception@example.com",
      user_role: "RECEPTIONIST",
      action: "BOOK_APPOINTMENT",
      resource_type: "Appointment",
      resource_id: "apt-001",
      ip_address: "192.168.1.42",
      status: "SUCCESS",
      detail: "Acquired atomic lock and booked slot 09:30 for Dr. Smith",
    },
    {
      id: "aud-9905",
      timestamp: "2026-10-07T09:05:10Z",
      user_email: "admin@example.com",
      user_role: "ADMIN",
      action: "VERIFY_PATIENT_SSN",
      resource_type: "Patient",
      resource_id: "PAT-1001",
      ip_address: "10.0.0.15",
      status: "SUCCESS",
      detail: "Resolved national ID deduplication verification",
    },
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs();
      if (Array.isArray(res) && res.length > 0) {
        setLogs(res);
      } else {
        setLogs(defaultLogs);
      }
    } catch (err) {
      setLogs(defaultLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    const matchesSearch =
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.resource_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.ip_address?.includes(search);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 shadow-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              HIPAA Security &amp; Compliance Audit Stream
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Immutable real-time audit trail capturing all PHI read/write and
              access attempts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IP, User, ID..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Actions</option>
            <option value="READ_EHR">READ_EHR</option>
            <option value="CREATE_PRESCRIPTION">CREATE_PRESCRIPTION</option>
            <option value="BOOK_APPOINTMENT">BOOK_APPOINTMENT</option>
            <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title="Refresh Log Stream"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Operator / Role</th>
              <th className="p-3">Action &amp; Target</th>
              <th className="p-3">IP Origin</th>
              <th className="p-3">Compliance Status</th>
              <th className="p-3">Security Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((log) => {
              const isBlocked =
                log.status === "BLOCKED" ||
                log.action?.includes("UNAUTHORIZED");

              return (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isBlocked ? "bg-rose-950/20" : ""
                  }`}
                >
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleTimeString()
                        : "11:45:00"}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="text-slate-200 font-semibold">
                      {log.user_email}
                    </div>
                    <span className="text-[10px] text-sky-400 uppercase font-sans font-bold">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        isBlocked
                          ? "bg-rose-900/60 text-rose-300 border border-rose-700"
                          : "bg-sky-950 text-sky-300 border border-sky-800"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="ml-2 text-slate-400">
                      {log.resource_type}: {log.resource_id}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 whitespace-nowrap">
                    {log.ip_address}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                        <XCircle className="w-3.5 h-3.5" /> BLOCKED 403
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> AUTHORIZED
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400 max-w-xs truncate text-[11px]">
                    {log.detail || "PHI record operation captured"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogStream;
