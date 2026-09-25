import React, { useState } from "react";
import { Calendar, Plus, CheckCircle, XCircle } from "lucide-react";
import { createFeedingSchedule } from "../../services/api";

export default function FeedingScheduleTable({
  schedules = [],
  tankId,
  tanks = [],
  onScheduleCreated,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    tank_id: tankId || tanks[0]?.id || "",
    food_type: "",
    portion_grams: "",
    frequency: "Daily",
    scheduled_time: "08:00 AM",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        tank_id: formData.tank_id || tankId,
        food_type: formData.food_type,
        portion_grams: parseFloat(formData.portion_grams) || 10,
        frequency: formData.frequency,
        scheduled_time: formData.scheduled_time,
        is_active: formData.is_active,
      };
      const created = await createFeedingSchedule(payload);
      setShowAddModal(false);
      setFormData({
        tank_id: tankId || tanks[0]?.id || "",
        food_type: "",
        portion_grams: "",
        frequency: "Daily",
        scheduled_time: "08:00 AM",
        is_active: true,
      });
      if (onScheduleCreated) onScheduleCreated(created);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to create feeding schedule",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#00e5ff]" />
          <h2 className="text-base font-bold font-mono text-[#00e5ff]">
            Configured Feeding Schedules
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c141f] hover:bg-[#1e2e45] text-[#00e5ff] text-xs font-mono font-semibold border border-[#00e5ff]/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Schedule</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1e2e45] text-[#8899a6] uppercase tracking-wider">
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Diet / Food Type</th>
              <th className="py-3 px-4">Portion</th>
              <th className="py-3 px-4">Frequency</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2e45]/50 text-[#dbe3f3]">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#bac9cc]">
                  No feeding schedules configured. Click "Add Schedule" to
                  configure automated feeding routines.
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  className="hover:bg-[#1e2e45]/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-[#00e5ff]">
                    {schedule.scheduled_time}
                  </td>
                  <td className="py-3.5 px-4 text-[#dbe3f3]">
                    {schedule.food_type}
                  </td>
                  <td className="py-3.5 px-4">{schedule.portion_grams}g</td>
                  <td className="py-3.5 px-4 text-[#bac9cc]">
                    {schedule.frequency}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {schedule.is_active !== false ? (
                      <span className="inline-flex items-center gap-1 text-[#34d399]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#8899a6]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Paused</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141c27] border border-[#1e2e45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-mono text-[#00e5ff]">
              Create Feeding Schedule
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-[#4c0519]/50 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 text-xs font-mono"
            >
              <div>
                <label className="block text-[#bac9cc] mb-1">Target Tank</label>
                <select
                  value={formData.tank_id || tankId}
                  onChange={(e) =>
                    setFormData({ ...formData, tank_id: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                >
                  {tanks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#bac9cc] mb-1">Food Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frozen Mysis Shrimp"
                  value={formData.food_type}
                  onChange={(e) =>
                    setFormData({ ...formData, food_type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#bac9cc] mb-1">
                    Portion (Grams) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 20"
                    value={formData.portion_grams}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        portion_grams: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#bac9cc] mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:00 PM"
                    value={formData.scheduled_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduled_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#bac9cc] mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                >
                  <option value="Daily">Daily</option>
                  <option value="Twice Daily">Twice Daily</option>
                  <option value="Every Other Day">Every Other Day</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded bg-[#0c141f] border-[#1e2e45] text-[#00e5ff] focus:ring-0"
                  />
                  <span className="text-[#dbe3f3]">Active Schedule</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2e45]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-[#bac9cc] hover:text-[#dbe3f3] hover:bg-[#1e2e45]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#00e5ff] text-[#070c13] text-xs font-bold font-mono hover:bg-[#00e5ff]/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
