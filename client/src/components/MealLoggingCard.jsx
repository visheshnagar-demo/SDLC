import React from "react";
import { PlusCircle, CheckCircle2, Clock } from "lucide-react";

export default function MealLoggingCard({
  mealType,
  loggedMeal,
  onQuickLog,
  points = 30,
}) {
  const isLogged = Boolean(
    loggedMeal && loggedMeal.items && loggedMeal.items.length > 0,
  );

  const getMealIcon = (type) => {
    switch (type.toLowerCase()) {
      case "breakfast":
        return "🥞";
      case "lunch":
        return "🥪";
      case "dinner":
        return "🍲";
      case "snacks":
      default:
        return "🍎";
    }
  };

  const getPointsLabel = (type) => {
    switch (type.toLowerCase()) {
      case "breakfast":
        return "+30 Pts";
      case "lunch":
        return "+40 Pts";
      case "dinner":
        return "+50 Pts";
      case "snacks":
        return "+20 Pts";
      default:
        return `+${points} Pts`;
    }
  };

  if (isLogged) {
    return (
      <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-3xl p-2 bg-emerald-50 rounded-2xl">
              {getMealIcon(mealType)}
            </span>
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-800">
                {mealType}
              </h3>
              <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Logged</span>
              </span>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
            {getPointsLabel(mealType)}
          </span>
        </div>

        <div className="space-y-2 mt-3">
          {loggedMeal.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-sm"
            >
              <span className="font-medium text-slate-700">
                {item.food_name || item.name}
              </span>
              <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-md border">
                {item.portion_size || "1 serving"}
              </span>
            </div>
          ))}
        </div>

        {loggedMeal.logged_at && (
          <p className="text-[11px] text-slate-400 mt-3 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(loggedMeal.logged_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-amber-50/70 p-5 rounded-3xl border-2 border-dashed border-amber-300 flex flex-col justify-between items-center text-center hover:bg-amber-100/60 transition-colors">
      <div className="flex flex-col items-center">
        <span className="text-4xl mb-2">{getMealIcon(mealType)}</span>
        <h3 className="font-heading font-bold text-lg text-slate-800">
          {mealType}
        </h3>
        <p className="text-xs text-amber-700 font-medium mt-1">
          Not logged yet today
        </p>
      </div>

      <button
        onClick={() => onQuickLog(mealType)}
        className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-1.5"
      >
        <PlusCircle className="w-4 h-4" />
        <span>
          + Log {mealType} ({getPointsLabel(mealType)})
        </span>
      </button>
    </div>
  );
}
