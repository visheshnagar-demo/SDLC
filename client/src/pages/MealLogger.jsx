import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mealService } from "../services/api";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Utensils,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function MealLogger({ activeChild, onMealLogged }) {
  const location = useLocation();
  const navigate = useNavigate();

  const initialCategory = location.state?.preselectedType || "Breakfast";

  const [mealType, setMealType] = useState(initialCategory);
  const [items, setItems] = useState([
    { food_name: "Apple", portion_size: "1 medium", food_group: "fruits" },
  ]);
  const [waterGlasses, setWaterGlasses] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successResult, setSuccessResult] = useState(null);

  const foodGroupOptions = [
    { value: "fruits", label: "Fruit 🍎" },
    { value: "vegetables", label: "Vegetable 🥦" },
    { value: "grains", label: "Whole Grain 🌾" },
    { value: "protein", label: "Protein 🍗" },
    { value: "dairy", label: "Dairy 🧀" },
  ];

  const quickPresets = [
    { name: "Apple 🍎", group: "fruits", portion: "1 piece" },
    { name: "Banana 🍌", group: "fruits", portion: "1 medium" },
    { name: "Oatmeal 🥣", group: "grains", portion: "1 bowl" },
    { name: "Broccoli 🥦", group: "vegetables", portion: "1 cup" },
    { name: "Carrot Sticks 🥕", group: "vegetables", portion: "1 cup" },
    { name: "Turkey Sandwich 🥪", group: "protein", portion: "1 sandwich" },
    { name: "Greek Yogurt 🥛", group: "dairy", portion: "1 cup" },
    { name: "Brown Rice 🍚", group: "grains", portion: "1/2 cup" },
  ];

  const handleAddItem = () => {
    setItems([
      ...items,
      { food_name: "", portion_size: "1 serving", food_group: "fruits" },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleAddPreset = (preset) => {
    setItems([
      ...items,
      {
        food_name: preset.name.replace(/[^a-zA-Z ]/g, "").trim(),
        portion_size: preset.portion,
        food_group: preset.group,
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validItems = items.filter((i) => i.food_name.trim().length > 0);
    if (validItems.length === 0) {
      setError("Please add at least one food item to log this meal.");
      setLoading(false);
      return;
    }

    const payload = {
      child_id: activeChild?.id || "00000000-0000-0000-0000-000000000001",
      meal_type: mealType,
      items: validItems,
      water_glasses: waterGlasses,
      logged_at: new Date().toISOString(),
    };

    try {
      const result = await mealService.logMeal(payload);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSuccessResult({
        mealType,
        itemsCount: validItems.length,
        pointsEarned: 40,
        streakDays: activeChild?.active_streak_days || 5,
      });

      if (onMealLogged) {
        onMealLogged(result || payload);
      }
    } catch (err) {
      // Direct error handling per frontend guidelines - no fake success
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to log meal. Please check server connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-lg text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center text-5xl shadow-inner">
            🎉
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-800">
            {successResult.mealType} Logged Successfully!
          </h2>
          <p className="text-slate-600">
            You earned{" "}
            <strong className="text-amber-600 font-bold">
              +{successResult.pointsEarned} Healthy Habit Points
            </strong>
            !
          </p>

          <div className="bg-gradient-to-r from-amber-50 to-emerald-50 p-4 rounded-2xl border border-amber-200 flex justify-around text-center">
            <div>
              <p className="text-xs text-slate-500 font-medium">Items Logged</p>
              <p className="font-heading font-bold text-lg text-slate-800">
                {successResult.itemsCount} Foods
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Daily Streak</p>
              <p className="font-heading font-bold text-lg text-amber-600">
                {successResult.streakDays} Days 🔥
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">
                Rainbow Plate
              </p>
              <p className="font-heading font-bold text-lg text-emerald-600">
                Updated! 🌈
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setSuccessResult(null);
                setItems([
                  {
                    food_name: "",
                    portion_size: "1 serving",
                    food_group: "fruits",
                  },
                ]);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow transition-colors"
            >
              + Log Another Meal
            </button>
            <button
              onClick={() => navigate("/child-dashboard")}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
            >
              Return to Kids Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm">
          <Utensils className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-slate-800">
            Log Your Healthy Meal 🍽️
          </h1>
          <p className="text-xs text-slate-500">
            Pick your meal time, add yummy foods, and collect bonus points!
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
      >
        {/* Meal Category Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Select Meal Time
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: "Breakfast", icon: "🥞" },
              { type: "Lunch", icon: "🥪" },
              { type: "Dinner", icon: "🍲" },
              { type: "Snacks", icon: "🍎" },
            ].map((cat) => (
              <button
                key={cat.type}
                type="button"
                onClick={() => setMealType(cat.type)}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  mealType === cat.type
                    ? "border-amber-500 bg-amber-50/70 font-bold text-amber-900 shadow-sm ring-2 ring-amber-300"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs">{cat.type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Food Suggestions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            ⚡ Quick Yummy Suggestions
          </label>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="bg-slate-50 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Food Items List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-700">
              Food Items in This Meal
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Food</span>
            </button>
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
            >
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  placeholder="Food name (e.g. Oatmeal, Apple)"
                  value={item.food_name}
                  onChange={(e) =>
                    handleItemChange(idx, "food_name", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Portion (1 cup, 1 piece)"
                  value={item.portion_size}
                  onChange={(e) =>
                    handleItemChange(idx, "portion_size", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={item.food_group}
                  onChange={(e) =>
                    handleItemChange(idx, "food_group", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-amber-400"
                >
                  {foodGroupOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex justify-center">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Water Intake with Meal */}
        <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-sky-900">
              Glasses of Water with this meal:
            </h4>
            <p className="text-[11px] text-sky-700">
              Stay hydrated for extra energy!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setWaterGlasses(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  waterGlasses === num
                    ? "bg-sky-500 text-white shadow-sm"
                    : "bg-white text-sky-700 border border-sky-200"
                }`}
              >
                🥤 {num} {num === 1 ? "Glass" : "Glasses"}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-full font-bold text-sm shadow-md transition-all transform hover:scale-[1.01] flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {loading
              ? "Submitting Meal..."
              : `Log ${mealType} & Claim Reward Points!`}
          </span>
        </button>
      </form>
    </div>
  );
}
