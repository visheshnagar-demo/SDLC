import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

const CATEGORY_COLORS = {
  Food: "bg-orange-50 text-orange-700 border-orange-200",
  Culture: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Adventure: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Relaxation: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Nightlife: "bg-purple-50 text-purple-700 border-purple-200",
  History: "bg-amber-50 text-amber-700 border-amber-200",
  Nature: "bg-green-50 text-green-700 border-green-200",
  Shopping: "bg-pink-50 text-pink-700 border-pink-200",
  Anime: "bg-rose-50 text-rose-700 border-rose-200",
  Photography: "bg-blue-50 text-blue-700 border-blue-200",
  Default: "bg-slate-50 text-slate-700 border-slate-200",
};

export function TimelineActivityCard({
  activity,
  index,
  totalInDay = 1,
  currency = "USD",
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isReadOnly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(activity.title || "");
  const [editDescription, setEditDescription] = useState(
    activity.description || "",
  );
  const [editCost, setEditCost] = useState(activity.estimated_cost ?? 0);
  const [editLocation, setEditLocation] = useState(activity.location || "");
  const [editCategory, setEditCategory] = useState(
    activity.category || "Culture",
  );
  const [editTimeSlot, setEditTimeSlot] = useState(
    activity.time_slot || "Morning",
  );
  const [editDuration, setEditDuration] = useState(
    activity.duration_minutes || 60,
  );

  const formatMoney = (amount) => {
    const num = Number(amount) || 0;
    if (num === 0) return "Free ($0)";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onEdit) {
      onEdit(activity.id, {
        title: editTitle.trim() || activity.title,
        description: editDescription.trim(),
        estimated_cost: Number(editCost) || 0,
        location: editLocation.trim(),
        category: editCategory,
        time_slot: editTimeSlot,
        duration_minutes: Number(editDuration) || 60,
      });
    }
    setIsEditing(false);
  };

  const badgeColorClass =
    CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.Default;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 relative overflow-hidden group">
      {/* Time Slot Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {activity.time_slot || "Activity"}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColorClass}`}
          >
            {activity.category || "General"}
          </span>
        </div>

        {/* Cost & Reorder Controls */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200/60">
              {formatMoney(activity.estimated_cost)}
            </span>
          </div>

          {!isReadOnly && !isEditing && (
            <div className="flex items-center gap-1 ml-1">
              {onMoveUp && index > 0 && (
                <button
                  type="button"
                  title="Move Activity Up"
                  onClick={() => onMoveUp(activity.id, index)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
              {onMoveDown && index < totalInDay - 1 && (
                <button
                  type="button"
                  title="Move Activity Down"
                  onClick={() => onMoveDown(activity.id, index)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                title="Edit Activity"
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Remove Activity"
                onClick={() => onDelete && onDelete(activity.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editing Form Mode */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                {Object.keys(CATEGORY_COLORS)
                  .filter((k) => k !== "Default")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Time Slot
              </label>
              <select
                value={editTimeSlot}
                onChange={(e) => setEditTimeSlot(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Morning">Morning</option>
                <option value="Lunch">Lunch</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Estimated Cost ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                min="10"
                step="15"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Location
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Description & Travel Tips
            </label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div>
          <h4 className="text-base font-bold text-slate-900 mb-1.5 tracking-tight">
            {activity.title}
          </h4>

          {activity.description && (
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {activity.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 pt-1">
            {activity.location && (
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {activity.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {activity.duration_minutes || 60} mins
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineActivityCard;
