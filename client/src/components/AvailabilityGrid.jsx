import React, { useState, useEffect } from "react";
import {
  Clock,
  Check,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  AlertCircle,
} from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_WINDOWS = [
  { id: "Morning", label: "Morning", icon: Sun },
  { id: "Afternoon", label: "Afternoon", icon: Sunset },
  { id: "Evening", label: "Evening", icon: Moon },
];

export function AvailabilityGrid({
  initialAvailability = [],
  onSaveAvailability,
  isLoading,
}) {
  const [slots, setSlots] = useState(() => {
    const defaultSlots = DAYS.map((day) => ({
      day_of_week: day,
      available_minutes: day === "Saturday" || day === "Sunday" ? 240 : 120,
      preferred_time_of_day:
        day === "Saturday" || day === "Sunday" ? "Morning" : "Evening",
    }));

    if (initialAvailability && initialAvailability.length > 0) {
      return defaultSlots.map((d) => {
        const found = initialAvailability.find(
          (a) => a.day_of_week?.toLowerCase() === d.day_of_week.toLowerCase(),
        );
        return found ? { ...d, ...found } : d;
      });
    }
    return defaultSlots;
  });

  useEffect(() => {
    if (initialAvailability && initialAvailability.length > 0) {
      setSlots((prev) =>
        prev.map((d) => {
          const found = initialAvailability.find(
            (a) => a.day_of_week?.toLowerCase() === d.day_of_week.toLowerCase(),
          );
          return found ? { ...d, ...found } : d;
        }),
      );
    }
  }, [initialAvailability]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateMinutes = (day, mins) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.day_of_week === day
          ? { ...s, available_minutes: Math.max(0, mins) }
          : s,
      ),
    );
    setSavedSuccess(false);
  };

  const updateWindow = (day, win) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.day_of_week === day ? { ...s, preferred_time_of_day: win } : s,
      ),
    );
    setSavedSuccess(false);
  };

  const applyPreset = (presetType) => {
    if (presetType === "balanced") {
      setSlots(
        DAYS.map((day) => ({
          day_of_week: day,
          available_minutes: day === "Saturday" || day === "Sunday" ? 240 : 120,
          preferred_time_of_day:
            day === "Saturday" || day === "Sunday" ? "Morning" : "Evening",
        })),
      );
    } else if (presetType === "intensive") {
      setSlots(
        DAYS.map((day) => ({
          day_of_week: day,
          available_minutes: 240,
          preferred_time_of_day: "Evening",
        })),
      );
    } else if (presetType === "weekend") {
      setSlots(
        DAYS.map((day) => ({
          day_of_week: day,
          available_minutes: day === "Saturday" || day === "Sunday" ? 360 : 60,
          preferred_time_of_day:
            day === "Saturday" || day === "Sunday" ? "Morning" : "Evening",
        })),
      );
    }
    setSavedSuccess(false);
  };

  const totalWeeklyMinutes = slots.reduce(
    (acc, s) => acc + (s.available_minutes || 0),
    0,
  );
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);

  const handleSave = async () => {
    setErrorMessage("");
    try {
      if (onSaveAvailability) {
        await onSaveAvailability({ weekly_slots: slots });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to save availability",
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Weekly Available Study Time
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            Total: {totalWeeklyHours} hrs / week
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Weekly availability saved successfully!</span>
        </div>
      )}

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-slate-500 font-medium">
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => applyPreset("balanced")}
          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          Balanced (2h wkdays, 4h wkends)
        </button>
        <button
          type="button"
          onClick={() => applyPreset("intensive")}
          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          Intensive (4h/day)
        </button>
        <button
          type="button"
          onClick={() => applyPreset("weekend")}
          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          Weekend Focus (6h wkends)
        </button>
      </div>

      {/* Days Grid */}
      <div className="space-y-3">
        {slots.map((slot) => {
          const hours = (slot.available_minutes / 60).toFixed(1);

          return (
            <div
              key={slot.day_of_week}
              className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="w-28 font-semibold text-sm text-slate-800">
                {slot.day_of_week}
              </div>

              {/* Slider & Hours Input */}
              <div className="flex-1 flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="480"
                  step="30"
                  value={slot.available_minutes}
                  onChange={(e) =>
                    updateMinutes(slot.day_of_week, Number(e.target.value))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                  aria-label={`Available minutes for ${slot.day_of_week}`}
                />
                <span className="w-16 text-xs font-bold text-slate-700 text-right">
                  {hours} hrs
                </span>
              </div>

              {/* Time of Day Windows */}
              <div className="flex items-center space-x-1">
                {TIME_WINDOWS.map((tw) => {
                  const Icon = tw.icon;
                  const isSelected = slot.preferred_time_of_day === tw.id;
                  return (
                    <button
                      key={tw.id}
                      type="button"
                      onClick={() => updateWindow(slot.day_of_week, tw.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                      title={tw.label}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{tw.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? "Saving..." : "Save Availability Profile"}</span>
        </button>
      </div>
    </div>
  );
}

export default AvailabilityGrid;
