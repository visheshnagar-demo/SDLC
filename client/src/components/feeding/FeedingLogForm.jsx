import React, { useState } from "react";
import { Utensils, Send } from "lucide-react";
import { createFeedingLog } from "../../services/api";

export default function FeedingLogForm({ tankId, tanks = [], onLogCreated }) {
  const [formData, setFormData] = useState({
    tank_id: tankId || tanks[0]?.id || "",
    food_type: "Marine Micro-Pellets",
    portion_grams: "15",
    fed_by: "Dr. Elena Rostova",
    notes: "Morning routine feed; vigorous feeding response noted.",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const payload = {
        tank_id: formData.tank_id || tankId,
        food_type: formData.food_type,
        portion_grams: parseFloat(formData.portion_grams) || 10,
        fed_by: formData.fed_by,
        notes: formData.notes,
      };
      const created = await createFeedingLog(payload);
      setSuccessMessage("Feeding event logged successfully!");
      if (onLogCreated) onLogCreated(created);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to record feeding log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
      <div className="flex items-center gap-2">
        <Utensils className="w-5 h-5 text-[#00e5ff]" />
        <h2 className="text-base font-bold font-mono text-[#00e5ff]">
          Log Manual Feeding Event
        </h2>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#4c0519]/50 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-[#064e3b]/50 border border-[#34d399] text-[#34d399] text-xs font-mono">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#bac9cc] mb-1">
              Food Type / Diet *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spirulina Flakes"
              value={formData.food_type}
              onChange={(e) =>
                setFormData({ ...formData, food_type: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[#bac9cc] mb-1">
              Portion (Grams) *
            </label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="e.g. 15"
              value={formData.portion_grams}
              onChange={(e) =>
                setFormData({ ...formData, portion_grams: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#bac9cc] mb-1">Logged / Fed By</label>
          <input
            type="text"
            required
            value={formData.fed_by}
            onChange={(e) =>
              setFormData({ ...formData, fed_by: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[#bac9cc] mb-1">Observation Notes</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="e.g. All specimens fed voraciously; no excess food settled."
            className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-[#070c13] font-bold font-mono uppercase text-xs tracking-wider transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>
            {isSubmitting ? "Recording Log..." : "Record Feeding Log"}
          </span>
        </button>
      </form>
    </div>
  );
}
