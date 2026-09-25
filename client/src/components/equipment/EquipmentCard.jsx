import React from "react";
import { Wrench, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export default function EquipmentCard({ equipment, onLogMaintenance }) {
  const isOverdue =
    equipment.status?.toUpperCase() === "OVERDUE" ||
    (equipment.next_due_at && new Date(equipment.next_due_at) < new Date());

  const isDueSoon =
    !isOverdue &&
    equipment.next_due_at &&
    new Date(equipment.next_due_at).getTime() - Date.now() <
      3 * 24 * 60 * 60 * 1000;

  return (
    <div
      className={`p-5 rounded-xl bg-[#141c27] border transition-all ${
        isOverdue
          ? "border-[#fb7185]/60 shadow-md shadow-[#fb7185]/10"
          : isDueSoon
            ? "border-[#fbbf24]/60"
            : "border-[#1e2e45] hover:border-[#00e5ff]/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#00e5ff] tracking-wider">
            {equipment.equipment_type}
          </span>
          <h3 className="text-base font-bold font-mono text-[#dbe3f3] mt-0.5">
            {equipment.name}
          </h3>
          {equipment.model_number && (
            <div className="text-xs text-[#8899a6] font-mono">
              Model: {equipment.model_number}
            </div>
          )}
        </div>

        {isOverdue ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#4c0519] text-[#fb7185] border border-[#fb7185]/40 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            OVERDUE
          </span>
        ) : isDueSoon ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#451a03] text-[#fbbf24] border border-[#fbbf24]/40">
            <Clock className="w-3 h-3" />
            DUE SOON
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#064e3b] text-[#34d399] border border-[#34d399]/30">
            <CheckCircle2 className="w-3 h-3" />
            OPERATIONAL
          </span>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#1e2e45] grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span className="text-[#8899a6] block">Interval:</span>
          <span className="text-[#dbe3f3] font-medium">
            {equipment.maintenance_interval_days} Days
          </span>
        </div>
        <div>
          <span className="text-[#8899a6] block">Next Due:</span>
          <span
            className={`font-medium ${isOverdue ? "text-[#fb7185]" : "text-[#dbe3f3]"}`}
          >
            {equipment.next_due_at
              ? new Date(equipment.next_due_at).toLocaleDateString()
              : "Immediate"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={() => onLogMaintenance(equipment)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0c141f] hover:bg-[#1e2e45] text-[#00e5ff] text-xs font-mono font-bold border border-[#00e5ff]/30 hover:border-[#00e5ff] transition-all"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Log Service & Reset Cycle</span>
        </button>
      </div>
    </div>
  );
}
