import React from "react";
import { Activity, Heart, Thermometer, Weight, Wind } from "lucide-react";

export function VitalsCard({ vitals, onChange, readOnly = false }) {
  const defaultVitals = {
    blood_pressure: "120/80 mmHg",
    heart_rate: "72 bpm",
    temperature: "98.6 °F",
    respiratory_rate: "16 bpm",
    oxygen_saturation: "99%",
    weight: "72 kg",
    height: "178 cm",
    bmi: "22.7",
    ...vitals,
  };

  const handleFieldChange = (field, val) => {
    if (readOnly || !onChange) return;
    onChange({ ...defaultVitals, [field]: val });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <Heart className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Patient Clinical Vitals
          </h4>
        </div>
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
          Normal Range
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Blood Pressure */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            <span>Blood Pressure</span>
          </div>
          {readOnly ? (
            <span className="text-sm font-bold text-slate-900">
              {defaultVitals.blood_pressure}
            </span>
          ) : (
            <input
              type="text"
              value={defaultVitals.blood_pressure}
              onChange={(e) =>
                handleFieldChange("blood_pressure", e.target.value)
              }
              className="w-full text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Heart Rate */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Heart Rate</span>
          </div>
          {readOnly ? (
            <span className="text-sm font-bold text-slate-900">
              {defaultVitals.heart_rate}
            </span>
          ) : (
            <input
              type="text"
              value={defaultVitals.heart_rate}
              onChange={(e) => handleFieldChange("heart_rate", e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Temperature */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            <span>Body Temp</span>
          </div>
          {readOnly ? (
            <span className="text-sm font-bold text-slate-900">
              {defaultVitals.temperature}
            </span>
          ) : (
            <input
              type="text"
              value={defaultVitals.temperature}
              onChange={(e) => handleFieldChange("temperature", e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Oxygen Saturation */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <Wind className="w-3.5 h-3.5 text-blue-500" />
            <span>SpO2 / O2 Sat</span>
          </div>
          {readOnly ? (
            <span className="text-sm font-bold text-slate-900">
              {defaultVitals.oxygen_saturation}
            </span>
          ) : (
            <input
              type="text"
              value={defaultVitals.oxygen_saturation}
              onChange={(e) =>
                handleFieldChange("oxygen_saturation", e.target.value)
              }
              className="w-full text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default VitalsCard;
