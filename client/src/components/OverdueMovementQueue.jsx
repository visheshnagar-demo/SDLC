import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  ShieldAlert,
} from "lucide-react";

export default function OverdueMovementQueue({
  activeMovements = [],
  onConfirmArrival,
}) {
  // Default sample active movements if API list is empty
  const displayMovements =
    activeMovements.length > 0
      ? activeMovements
      : [
          {
            id: "mov-201",
            inmate_name: "Marcus Vance (BK-2026-0001)",
            source_location: "Block A-101",
            destination_location: "Medical Clinic",
            departure_time: "10:15 AM",
            elapsed_minutes: 42,
            is_overdue: true,
            escort_officer: "Officer J. Smith (ID-8821)",
            purpose: "Medical Exam",
          },
          {
            id: "mov-202",
            inmate_name: "Damian Reed (BK-2026-0002)",
            source_location: "Block B-204",
            destination_location: "Courtroom 3B",
            departure_time: "10:40 AM",
            elapsed_minutes: 17,
            is_overdue: false,
            escort_officer: "Officer T. Davis (ID-4412)",
            purpose: "Court Appearance",
          },
        ];

  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#334155]">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#2563EB]">
            <Clock className="w-5 h-5" /> Active Movements & 30-Min Watchdog
            Queue
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time transit tracking & automated facility headcount
            reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#7F1D1D]/40 text-[#EF4444] border border-[#EF4444]/30 px-3 py-1 rounded-full text-xs font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>
            {displayMovements.filter((m) => m.is_overdue).length} Overdue
            Movement(s)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#090D16] text-[#94A3B8] uppercase border-b border-[#334155]">
              <th className="p-3">Inmate</th>
              <th className="p-3">Route (From &rarr; To)</th>
              <th className="p-3">Escort Officer</th>
              <th className="p-3">Departure</th>
              <th className="p-3">Elapsed Time</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {displayMovements.map((m) => (
              <tr
                key={m.id}
                className={
                  m.is_overdue
                    ? "bg-red-950/20 hover:bg-red-950/40"
                    : "hover:bg-[#1E293B]"
                }
              >
                <td className="p-3 font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />{" "}
                    {m.inmate_name}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{m.source_location}</span> &rarr;{" "}
                    <span className="font-bold text-white">
                      {m.destination_location}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-slate-300">{m.escort_officer}</td>
                <td className="p-3 font-mono text-slate-300">
                  {m.departure_time}
                </td>
                <td className="p-3 font-mono font-bold">
                  <span
                    className={
                      m.is_overdue
                        ? "text-red-400 animate-pulse"
                        : "text-emerald-400"
                    }
                  >
                    {m.elapsed_minutes} mins
                  </span>
                </td>
                <td className="p-3">
                  {m.is_overdue ? (
                    <span className="inline-flex items-center gap-1 bg-red-900/60 text-red-200 border border-red-500/50 px-2 py-0.5 rounded font-bold text-[10px]">
                      <AlertTriangle className="w-3 h-3" /> OVERDUE ALERT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold text-[10px]">
                      In Transit
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => onConfirmArrival && onConfirmArrival(m.id)}
                    className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs rounded transition-colors inline-flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Confirm Arrival
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
