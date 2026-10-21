import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Check,
  AlertCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import { doctorsApi } from "../../services/api";

const DAYS_OF_WEEK = [
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
  { key: "SATURDAY", label: "Saturday" },
  { key: "SUNDAY", label: "Sunday" },
];

export function ScheduleConfigurator({ doctor, onScheduleSaved }) {
  const [schedules, setSchedules] = useState(
    DAYS_OF_WEEK.map((d) => ({
      day_of_week: d.key,
      is_active: d.key !== "SATURDAY" && d.key !== "SUNDAY",
      start_time: "09:00",
      end_time: "17:00",
      slot_duration_minutes: 30,
    })),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [doctor]);

  const handleToggleDay = (dayKey) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayKey ? { ...s, is_active: !s.is_active } : s,
      ),
    );
  };

  const handleTimeChange = (dayKey, field, value) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayKey ? { ...s, [field]: value } : s,
      ),
    );
  };

  const calculateDailyCapacity = (s) => {
    if (!s.is_active) return 0;
    const [startH, startM] = s.start_time.split(":").map(Number);
    const [endH, endM] = s.end_time.split(":").map(Number);
    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (totalMinutes <= 0) return 0;
    return Math.floor(totalMinutes / (s.slot_duration_minutes || 30));
  };

  const handleSave = async () => {
    if (!doctor || !doctor.id) {
      setError(
        "Please select a doctor from the roster to configure their schedule.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Save schedule for each active day
      for (const s of schedules) {
        if (s.is_active) {
          await doctorsApi.saveSchedule(doctor.id, {
            doctor_id: doctor.id,
            day_of_week: s.day_of_week,
            start_time: `${s.start_time}:00`,
            end_time: `${s.end_time}:00`,
            is_active: true,
          });
        }
      }
      setSuccessMsg(
        `Working hours updated successfully for Dr. ${doctor.user?.full_name || doctor.doctor_code}.`,
      );
      if (onScheduleSaved) onScheduleSaved(schedules);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save doctor schedule.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-xs font-semibold text-slate-700">
          No Doctor Selected
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Select a doctor from the roster to configure shifts and consultation
          slots.
        </p>
      </div>
    );
  }

  const totalWeeklyCapacity = schedules.reduce(
    (acc, s) => acc + calculateDailyCapacity(s),
    0,
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Shift & Working Hours Configuration
            </h3>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {doctor.doctor_code || "DOC-101"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuring for{" "}
            <span className="font-semibold text-slate-800">
              {doctor.user?.full_name || "Doctor"}
            </span>{" "}
            ({doctor.department || "Cardiology"})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Weekly Slot Capacity
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {totalWeeklyCapacity} Slots / Wk
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {loading ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const schedule = schedules.find((s) => s.day_of_week === day.key) || {
            is_active: false,
            start_time: "09:00",
            end_time: "17:00",
          };
          const capacity = calculateDailyCapacity(schedule);

          return (
            <div
              key={day.key}
              className={`p-3.5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                schedule.is_active
                  ? "bg-slate-50/60 border-slate-200"
                  : "bg-slate-100/40 border-slate-200/60 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 w-36">
                <input
                  type="checkbox"
                  id={`day-${day.key}`}
                  checked={schedule.is_active}
                  onChange={() => handleToggleDay(day.key)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor={`day-${day.key}`}
                  className="text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {day.label}
                </label>
              </div>

              {schedule.is_active ? (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Start:
                    </span>
                    <input
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) =>
                        handleTimeChange(day.key, "start_time", e.target.value)
                      }
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      End:
                    </span>
                    <input
                      type="time"
                      value={schedule.end_time}
                      onChange={(e) =>
                        handleTimeChange(day.key, "end_time", e.target.value)
                      }
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-white px-2.5 py-1 rounded border border-slate-200">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>{capacity} slots (30m)</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Off-duty / Closed
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScheduleConfigurator;
