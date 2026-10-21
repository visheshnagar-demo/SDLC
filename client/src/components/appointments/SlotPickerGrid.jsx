import React from "react";
import { Clock, Check, AlertCircle } from "lucide-react";

export function SlotPickerGrid({
  availableSlots = [],
  selectedSlot = null,
  onSelectSlot,
  loading = false,
  error = null,
}) {
  if (loading) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mb-2"></div>
        <p className="text-xs text-slate-500 font-medium">
          Checking real-time slot availability...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // Default fallback slot list if no backend slots returned yet
  const displaySlots =
    availableSlots.length > 0
      ? availableSlots
      : [
          { time: "09:00 AM", iso_start: "09:00:00", available: true },
          { time: "09:30 AM", iso_start: "09:30:00", available: true },
          { time: "10:00 AM", iso_start: "10:00:00", available: true },
          {
            time: "10:30 AM",
            iso_start: "10:30:00",
            available: false,
            reason: "Booked",
          },
          { time: "11:00 AM", iso_start: "11:00:00", available: true },
          { time: "11:30 AM", iso_start: "11:30:00", available: true },
          { time: "02:00 PM", iso_start: "14:00:00", available: true },
          { time: "02:30 PM", iso_start: "14:30:00", available: true },
          {
            time: "03:00 PM",
            iso_start: "15:00:00",
            available: false,
            reason: "Reserved",
          },
          { time: "03:30 PM", iso_start: "15:30:00", available: true },
          { time: "04:00 PM", iso_start: "16:00:00", available: true },
          { time: "04:30 PM", iso_start: "16:30:00", available: true },
        ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Select 30-Minute Consultation Slot</span>
        </span>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300"></span>{" "}
            Open
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-indigo-600"></span> Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-200"></span>{" "}
            Unavailable
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {displaySlots.map((slot) => {
          const isSelected =
            selectedSlot === slot.time || selectedSlot === slot.iso_start;
          const isAvailable = slot.available !== false;

          return (
            <button
              key={slot.time || slot.iso_start}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectSlot && onSelectSlot(slot)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
                  : isAvailable
                    ? "bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
              }`}
            >
              <span>{slot.time || slot.iso_start}</span>
              {isSelected ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : !isAvailable ? (
                <span className="text-[10px] text-slate-400 font-normal">
                  {slot.reason || "Booked"}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SlotPickerGrid;
