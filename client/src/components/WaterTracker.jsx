import React from "react";
import { Droplet, Plus } from "lucide-react";

export default function WaterTracker({
  glasses = 0,
  maxGlasses = 6,
  onAddGlass,
}) {
  const currentGlasses = Math.min(glasses, maxGlasses);
  const items = Array.from(
    { length: maxGlasses },
    (_, i) => i < currentGlasses,
  );

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-sky-100 text-sky-600 rounded-2xl">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-800">
              Water Tracker
            </h3>
            <p className="text-xs text-slate-500">
              Target: {maxGlasses} glasses a day
            </p>
          </div>
        </div>
        <span className="font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full text-sm">
          💧 {currentGlasses} / {maxGlasses}
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2 my-4">
        {items.map((isFilled, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
              isFilled
                ? "bg-sky-500 text-white shadow-sm transform scale-105"
                : "bg-slate-100 text-slate-300 border border-slate-200"
            }`}
          >
            <span className="text-2xl">{isFilled ? "🥤" : "🥛"}</span>
            <span className="text-[10px] font-bold mt-1">#{idx + 1}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onAddGlass}
        disabled={glasses >= maxGlasses}
        className={`w-full py-2.5 rounded-full font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-1.5 ${
          glasses >= maxGlasses
            ? "bg-emerald-500 text-white cursor-default"
            : "bg-sky-500 hover:bg-sky-600 text-white hover:scale-[1.01]"
        }`}
      >
        {glasses >= maxGlasses ? (
          <span>🎉 Daily Hydration Target Met!</span>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>+ Add a Glass of Water (+10 Pts)</span>
          </>
        )}
      </button>
    </div>
  );
}
