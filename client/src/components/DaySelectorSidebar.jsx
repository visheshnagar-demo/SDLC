import React from "react";
import { Calendar, ChevronRight } from "lucide-react";

export function DaySelectorSidebar({
  days = [],
  selectedDayId,
  onSelectDay,
  currency = "USD",
}) {
  const formatMoney = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-slate-900 text-sm">Trip Days</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
          {days.length} {days.length === 1 ? "Day" : "Days"}
        </span>
      </div>

      {/* Days List / Scroll Container */}
      <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
        {days.map((day, idx) => {
          const isSelected = selectedDayId === day.id;
          const activityCount = day.activities?.length || 0;
          const dayCost =
            day.daily_estimated_cost ||
            day.activities?.reduce(
              (acc, a) => acc + (Number(a.estimated_cost) || 0),
              0,
            ) ||
            0;

          return (
            <button
              key={day.id || idx}
              type="button"
              onClick={() => onSelectDay(day.id)}
              className={`flex-shrink-0 sm:w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-primary-50 border-primary-300 ring-1 ring-primary-500 shadow-sm"
                  : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  D{day.day_number || idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Day {day.day_number || idx + 1}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {activityCount}{" "}
                    {activityCount === 1 ? "activity" : "activities"}
                  </div>
                </div>
              </div>

              <div className="text-right pl-3">
                <div className="text-xs font-bold text-primary-700">
                  {formatMoney(dayCost)}
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 hidden sm:inline-block ml-auto transition-transform ${
                    isSelected
                      ? "text-primary-600 translate-x-0.5"
                      : "text-slate-300"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default DaySelectorSidebar;
