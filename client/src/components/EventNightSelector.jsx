import React from "react";
import { Calendar, MapPin, Sparkles, Clock, CheckCircle } from "lucide-react";

export function EventNightSelector({
  events,
  selectedEventId,
  onSelectEvent,
  loading,
}) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="min-w-[280px] h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Select Garba Night or Season Pass</span>
        </label>
        <span className="text-xs text-slate-400 font-medium">
          {events.length} Night{events.length === 1 ? "" : "s"} Available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => {
          const isSelected = selectedEventId === event.id;
          const isSeason =
            event.is_season || event.title?.toLowerCase().includes("season");

          return (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectEvent(event.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectEvent(event.id);
                }
              }}
              className={`relative text-left p-5 rounded-2xl transition-all cursor-pointer border ${
                isSelected
                  ? "bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border-[#f59e0b] shadow-xl shadow-amber-500/10 ring-2 ring-[#f59e0b]/40"
                  : "bg-[#0f172a]/80 hover:bg-[#0f172a] border-slate-800 hover:border-slate-700"
              }`}
            >
              {isSeason && (
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Best Value
                </div>
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <h3
                  className={`font-['Syne'] font-bold text-lg leading-tight ${isSelected ? "text-[#ffc174]" : "text-slate-100"}`}
                >
                  {event.title}
                </h3>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
              </div>

              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {event.description ||
                  "Traditional Raas Garba live orchestra, celebrity performers, and food festival."}
              </p>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1 text-amber-200/80">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{event.start_date || "Oct 15 - Oct 24, 2026"}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{event.venue_name || "Grand Arena Complex"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventNightSelector;
