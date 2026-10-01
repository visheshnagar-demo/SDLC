import React from "react";

export default function NutrientProgressBar({ categories = {} }) {
  const defaultTargets = [
    {
      key: "fruits",
      label: "Fruits",
      icon: "🍎",
      target: 2,
      unit: "servings",
      color: "bg-rose-500",
      barBg: "bg-rose-100",
      text: "text-rose-700",
    },
    {
      key: "vegetables",
      label: "Vegetables",
      icon: "🥦",
      target: 3,
      unit: "servings",
      color: "bg-emerald-500",
      barBg: "bg-emerald-100",
      text: "text-emerald-700",
    },
    {
      key: "grains",
      label: "Whole Grains",
      icon: "🌾",
      target: 3,
      unit: "servings",
      color: "bg-amber-500",
      barBg: "bg-amber-100",
      text: "text-amber-700",
    },
    {
      key: "protein",
      label: "Proteins & Dairy",
      icon: "🍗",
      target: 2,
      unit: "servings",
      color: "bg-purple-500",
      barBg: "bg-purple-100",
      text: "text-purple-700",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-slate-800">
            Eat The Rainbow 🌈
          </h3>
          <p className="text-xs text-slate-500">Daily nutrition goals</p>
        </div>
        <span className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-semibold border border-amber-200">
          Daily Targets
        </span>
      </div>

      <div className="space-y-4">
        {defaultTargets.map((group) => {
          const current =
            categories[group.key] ?? categories[group.label.toLowerCase()] ?? 0;
          const percent = Math.min(
            100,
            Math.round((current / group.target) * 100),
          );
          const isComplete = current >= group.target;

          return (
            <div key={group.key} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                  <span>{group.icon}</span>
                  <span>{group.label}</span>
                </span>
                <span className={`text-xs font-bold ${group.text}`}>
                  {current} / {group.target} {group.unit} {isComplete && "✅"}
                </span>
              </div>
              <div
                className={`w-full h-3 rounded-full overflow-hidden ${group.barBg}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${group.color}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
