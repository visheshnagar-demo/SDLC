import React from "react";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function FeedingChecklist({
  schedules = [],
  logs = [],
  onQuickLog,
}) {
  return (
    <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#00e5ff]" />
          <h2 className="text-base font-bold font-mono text-[#00e5ff]">
            Today's Feeding Timeline & Checklist
          </h2>
        </div>
        <span className="text-xs font-mono text-[#bac9cc]">
          {schedules.length} Scheduled Slot{schedules.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="p-6 rounded-lg bg-[#0c141f] border border-dashed border-[#1e2e45] text-center text-xs font-mono text-[#bac9cc]">
            No feeding schedules configured for this tank. Add a schedule below
            to populate the timeline.
          </div>
        ) : (
          schedules.map((schedule) => {
            // Find if there is a log completed for this schedule today
            const isCompleted = logs.some(
              (log) =>
                log.schedule_id === schedule.id ||
                log.food_type === schedule.food_type,
            );

            return (
              <div
                key={schedule.id}
                className="p-4 rounded-lg bg-[#0c141f] border border-[#1e2e45] hover:border-[#1e2e45]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded-md bg-[#141c27] text-[#00e5ff] font-mono text-xs font-bold border border-[#1e2e45]">
                    {schedule.scheduled_time || "08:00 AM"}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#dbe3f3] font-mono">
                      {schedule.food_type} ({schedule.portion_grams}g)
                    </div>
                    <div className="text-xs text-[#bac9cc] font-mono mt-0.5">
                      Frequency: {schedule.frequency || "Daily"} • Auto-Feeder /
                      Manual
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#064e3b] text-[#34d399] border border-[#059669]/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      COMPLETED
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuickLog(schedule)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#070c13] text-xs font-mono font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Fed</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
