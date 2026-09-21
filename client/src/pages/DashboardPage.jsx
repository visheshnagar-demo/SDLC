import React, { useState } from "react";
import InmateRosterTable from "../components/inmates/InmateRosterTable";
import InmateIntakeModal from "../components/inmates/InmateIntakeModal";
import { UserPlus } from "lucide-react";

export function DashboardPage({ currentRole = "ADMIN" }) {
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedInmate, setSelectedInmate] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-cyan-400">
            INMATE ROSTER & MANAGEMENT DASHBOARD
          </h1>
          <p className="text-xs font-mono text-slate-400">
            PRISON PROFILE RECORDS, SECURITY TIERS & MEDICAL ALERTS
          </p>
        </div>

        <button
          onClick={() => setIsIntakeOpen(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono rounded shadow flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> + Register New Inmate Intake
        </button>
      </div>

      {selectedInmate && (
        <div className="p-4 bg-slate-900 border border-cyan-800 rounded font-mono text-xs text-slate-200 flex justify-between items-center">
          <div>
            <span className="font-bold text-cyan-400">
              Selected Inmate Detail:
            </span>{" "}
            {selectedInmate.first_name} {selectedInmate.last_name} (ID:{" "}
            {selectedInmate.inmate_number || selectedInmate.id}) • Tier:{" "}
            {selectedInmate.security_tier}
          </div>
          <button
            onClick={() => setSelectedInmate(null)}
            className="text-slate-400 hover:text-white underline text-[11px]"
          >
            Clear
          </button>
        </div>
      )}

      <InmateRosterTable
        userRole={currentRole}
        onSelectInmate={(inmate) => setSelectedInmate(inmate)}
      />

      <InmateIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        userRole={currentRole}
      />
    </div>
  );
}

export default DashboardPage;
