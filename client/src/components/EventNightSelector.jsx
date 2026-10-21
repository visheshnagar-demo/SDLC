import React from "react";
import { Calendar, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

export const EventNightSelector = ({
  events = [],
  selectedEventId,
  onSelectEvent,
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-slate-400 text-sm">
          No Garba events available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#F59E0B]" />
          <span>Select Garba Night</span>
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {events.length} Event{events.length > 1 ? "s" : ""} Available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => {
          const isSelected = selectedEventId === event.id;
          const startDate = new Date(event.start_date).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            },
          );
          const endDate = new Date(event.end_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className={`cursor-pointer group relative rounded-2xl p-5 border transition-all duration-200 ${
                isSelected
                  ? "bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] border-[#F59E0B] shadow-lg shadow-[#F59E0B]/15 ring-1 ring-[#F59E0B]"
                  : "bg-[#0F172A]/80 hover:bg-[#0F172A] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 uppercase tracking-wider">
                    {event.status || "Active"}
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-100 group-hover:text-[#F59E0B] transition-colors">
                    {event.title}
                  </h3>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                )}
              </div>

              {event.description && (
                <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                  {event.description}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>
                    {startDate} {startDate !== endDate ? `- ${endDate}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#BE185D]" />
                  <span className="truncate">{event.venue_name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventNightSelector;
