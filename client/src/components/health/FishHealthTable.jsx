import React from "react";
import {
  HeartPulse,
  Plus,
  AlertCircle,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";

export default function FishHealthTable({ records = [], onAddRecord }) {
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "CRITICAL":
      case "DISEASED":
        return "bg-[#4c0519] text-[#fb7185] border-[#fb7185]/40";
      case "TREATMENT":
      case "MONITORING":
        return "bg-[#451a03] text-[#fbbf24] border-[#fbbf24]/40";
      case "HEALTHY":
      default:
        return "bg-[#064e3b] text-[#34d399] border-[#34d399]/40";
    }
  };

  return (
    <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-[#00e5ff]" />
          <h2 className="text-base font-bold font-mono text-[#00e5ff]">
            Fish Population & Health Observations
          </h2>
        </div>
        <button
          type="button"
          onClick={onAddRecord}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c141f] hover:bg-[#1e2e45] text-[#00e5ff] text-xs font-mono font-semibold border border-[#00e5ff]/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log Observation</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1e2e45] text-[#8899a6] uppercase tracking-wider">
              <th className="py-3 px-4">Species</th>
              <th className="py-3 px-4">Count</th>
              <th className="py-3 px-4">Health Status</th>
              <th className="py-3 px-4">Quarantine</th>
              <th className="py-3 px-4">Symptoms / Treatment</th>
              <th className="py-3 px-4 text-right">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2e45]/50 text-[#dbe3f3]">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#bac9cc]">
                  No fish health records logged. Click "Log Observation" to
                  record specimen health and census data.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-[#1e2e45]/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-[#c3f5ff]">
                    {record.species}
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    {record.population_count}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                        record.health_status,
                      )}`}
                    >
                      {record.health_status || "Healthy"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {record.is_quarantined ? (
                      <span className="inline-flex items-center gap-1 text-[#fbbf24] font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>ISOLATED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#8899a6]">
                        <span>General Pop</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-[#bac9cc]">
                    {record.symptoms ||
                      record.treatment_notes ||
                      "Routine check; normal behavior"}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#8899a6]">
                    {record.recorded_by || "Staff"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
