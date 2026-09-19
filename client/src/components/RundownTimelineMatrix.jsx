import React from "react";
import {
  Clock,
  AlertCircle,
  Play,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export default function RundownTimelineMatrix({
  schedules = [],
  channels = [],
  programs = [],
  onSelectSlot,
  onAddSlot,
}) {
  const hours = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`,
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Matrix Controls Header */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">
            24-Hour Rundown Matrix & Conflict Detector
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            ON AIR Slot
          </span>
          <span className="flex items-center gap-1 text-red-400 font-mono">
            <ShieldAlert className="w-3.5 h-3.5" /> Emergency Override
          </span>
          <button
            onClick={() => onAddSlot && onAddSlot()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg shadow transition-colors"
          >
            + Add Slot
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto p-4">
        <div className="min-w-[900px] space-y-4">
          {channels.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-mono text-sm">
              No channels available for scheduling. Register channels first.
            </div>
          ) : (
            channels.map((channel) => {
              const channelSchedules = schedules.filter(
                (s) => s.channel_id === channel.id,
              );

              return (
                <div
                  key={channel.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                        {channel.code}
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {channel.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({channel.resolution})
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {channelSchedules.length} Slots Scheduled
                    </span>
                  </div>

                  {/* Scheduled Slots Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                    {channelSchedules.length === 0 ? (
                      <div className="col-span-full py-3 text-center text-xs text-slate-600 border border-dashed border-slate-800 rounded">
                        No program slots assigned today. Click "+ Add Slot"
                        above to schedule.
                      </div>
                    ) : (
                      channelSchedules.map((slot) => {
                        const program = programs.find(
                          (p) => p.id === slot.program_id,
                        );
                        const isEmergency = slot.is_emergency_override;

                        return (
                          <div
                            key={slot.id}
                            onClick={() => onSelectSlot && onSelectSlot(slot)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] ${
                              isEmergency
                                ? "bg-red-950/70 border-red-600/80 text-red-200 shadow-red-900/30"
                                : "bg-slate-800/90 border-slate-700/80 text-slate-200 hover:border-blue-500"
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                              <span>
                                {new Date(slot.start_time).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                                {" - "}
                                {new Date(slot.end_time).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                              {isEmergency && (
                                <span className="text-red-400 font-bold bg-red-900/80 px-1 rounded">
                                  OVERRIDE
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-slate-100 truncate">
                              {program?.title ||
                                slot.notes ||
                                "Scheduled Bulletin"}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                              <span>
                                Host: {program?.host_name || "Staff Host"}
                              </span>
                              <span className="text-emerald-400 font-mono text-[10px]">
                                {slot.status || "CONFIRMED"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
