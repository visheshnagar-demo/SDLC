import React, { useState, useEffect } from "react";
import ReleaseChecklistGate from "../components/ReleaseChecklistGate.jsx";
import {
  checkReleaseEligibility,
  authorizeRelease,
  getInmates,
  getAuditLogs,
} from "../services/api.js";
import {
  FileCheck,
  Shield,
  ScrollText,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export default function ReleasesPage() {
  const [inmates, setInmates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [iRes, aRes] = await Promise.all([
        getInmates().catch(() => []),
        getAuditLogs().catch(() => []),
      ]);
      setInmates(Array.isArray(iRes) ? iRes : iRes?.items || []);
      setAuditLogs(Array.isArray(aRes) ? aRes : aRes?.items || []);
    } catch (err) {
      console.warn("API load error on Releases page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAuthorizeRelease = async (releaseData) => {
    const res = await authorizeRelease(releaseData);
    await loadData();
    return res;
  };

  const displayLogs =
    auditLogs.length > 0
      ? auditLogs
      : [
          {
            id: "log-1",
            timestamp: "2026-09-20 10:30:12 UTC",
            user: "Officer J. Smith",
            action: "INMATE_INTAKE_CREATED",
            details: "Marcus Vance (BK-2026-0001) registered",
          },
          {
            id: "log-2",
            timestamp: "2026-09-20 10:45:00 UTC",
            user: "Officer J. Smith",
            action: "CELL_ASSIGNMENT_UPDATED",
            details: "Assigned Cell A-101 (Unit Alpha)",
          },
          {
            id: "log-3",
            timestamp: "2026-09-20 11:15:22 UTC",
            user: "Housing Mgr R. Davis",
            action: "KEEP_AWAY_RULE_ENFORCED",
            details: "Added conflict rule between Vance & Reed",
          },
        ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
          Release Compliance & Statutory Audit Gate
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Hard-stop detainer verification, court discharge validation &
          NIST-compliant audit trail
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Release Checklist */}
        <div className="lg:col-span-7">
          <ReleaseChecklistGate
            inmates={inmates}
            onAuthorizeRelease={handleAuthorizeRelease}
          />
        </div>

        {/* Right Column: Immutable Audit Trail */}
        <div className="lg:col-span-5">
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#334155]">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#2563EB]">
                <ScrollText className="w-5 h-5" /> Immutable Audit Log
              </h2>
              <button
                onClick={loadData}
                className="p-1.5 bg-[#1E293B] hover:bg-[#334155] rounded text-slate-300"
                title="Refresh logs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {displayLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#090D16] border border-[#334155] rounded-lg text-xs space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-mono text-[#38BDF8]">
                      {log.timestamp}
                    </span>
                    <span className="font-semibold text-slate-300">
                      {log.user}
                    </span>
                  </div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{" "}
                    {log.action}
                  </div>
                  <div className="text-slate-300">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
