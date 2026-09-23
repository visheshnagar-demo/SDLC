import React, { useState } from "react";
import {
  PlusCircle,
  Book,
  Calendar,
  Clock,
  Star,
  Palette,
  AlertCircle,
} from "lucide-react";

const COLOR_OPTIONS = [
  { name: "Blue", value: "#2563EB", bg: "bg-blue-600" },
  { name: "Purple", value: "#7C3AED", bg: "bg-purple-600" },
  { name: "Teal", value: "#0D9488", bg: "bg-teal-600" },
  { name: "Orange", value: "#EA580C", bg: "bg-orange-600" },
  { name: "Rose", value: "#E11D48", bg: "bg-rose-600" },
  { name: "Emerald", value: "#059669", bg: "bg-emerald-600" },
];

export function SubjectInputForm({ onAddSubject, isLoading }) {
  // Default target date: 30 days from today
  const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [name, setName] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [estimatedHours, setEstimatedHours] = useState(25);
  const [colorTag, setColorTag] = useState(COLOR_OPTIONS[0].value);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Subject name is required.");
      return;
    }

    if (!targetDate) {
      setFormError("Target exam or completion date is required.");
      return;
    }

    const hours = Number(estimatedHours);
    if (isNaN(hours) || hours <= 0) {
      setFormError("Estimated hours must be greater than 0.");
      return;
    }

    const payload = {
      name: name.trim(),
      difficulty_level: Number(difficultyLevel),
      target_date: targetDate,
      estimated_total_hours: hours,
      color_tag: colorTag,
    };

    try {
      await onAddSubject(payload);
      setName("");
      setEstimatedHours(25);
      setDifficultyLevel(3);
    } catch (err) {
      setFormError(
        err?.response?.data?.detail || err.message || "Failed to add subject",
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
        <PlusCircle className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-slate-900">Add Study Subject</h2>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="subject-name"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Subject Name *
          </label>
          <div className="relative">
            <Book className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              id="subject-name"
              type="text"
              required
              placeholder="e.g. Organic Chemistry, Algorithms, Macroeconomics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="difficulty-level"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Difficulty Level (1 = Easiest, 5 = Hardest)
            </label>
            <div className="flex items-center space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficultyLevel(lvl)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                    difficultyLevel >= lvl
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200"
                  }`}
                  title={`Level ${lvl}`}
                >
                  <Star
                    className={`w-3 h-3 ${difficultyLevel >= lvl ? "fill-amber-500 text-amber-500" : ""}`}
                  />
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="estimated-hours"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Estimated Total Hours *
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="estimated-hours"
                type="number"
                min="1"
                step="0.5"
                required
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="target-date"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Target Exam / Completion Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="target-date"
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Color Theme
            </label>
            <div className="flex items-center space-x-2 pt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColorTag(c.value)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                    colorTag === c.value
                      ? "ring-2 ring-offset-2 ring-slate-800 scale-110"
                      : "opacity-75 hover:opacity-100"
                  }`}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isLoading ? "Adding Subject..." : "Add Subject"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubjectInputForm;
