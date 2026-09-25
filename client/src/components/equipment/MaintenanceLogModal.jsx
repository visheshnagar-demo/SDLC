import React, { useState } from "react";
import { X, Wrench, Save } from "lucide-react";
import { createMaintenanceLog } from "../../services/api";

export default function MaintenanceLogModal({
  isOpen,
  onClose,
  equipment,
  onLogCompleted,
}) {
  const [formData, setFormData] = useState({
    action_taken:
      "Replaced mechanical filter floss, rinsed biological media, cleaned impeller assembly.",
    technician_notes:
      "All seals inspected and greased with silicone; flow rate restored to 100%.",
    performed_by: "Dr. Elena Rostova",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !equipment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        equipment_id: equipment.id,
        action_taken: formData.action_taken,
        technician_notes: formData.technician_notes || null,
        performed_by: formData.performed_by,
      };
      const result = await createMaintenanceLog(equipment.id, payload);
      if (onLogCompleted) onLogCompleted(result);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to log maintenance service",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#141c27] border border-[#1e2e45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2e45]">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#00e5ff]" />
            <div>
              <h3 className="text-base font-bold font-mono text-[#00e5ff]">
                Log Equipment Maintenance
              </h3>
              <p className="text-xs text-[#bac9cc] font-mono">
                {equipment.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bac9cc] hover:text-[#dbe3f3]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#4c0519]/50 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-[#bac9cc] mb-1">
              Action Performed *
            </label>
            <textarea
              rows={2}
              required
              value={formData.action_taken}
              onChange={(e) =>
                setFormData({ ...formData, action_taken: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#bac9cc] mb-1">
              Technician / Caretaker Name *
            </label>
            <input
              type="text"
              required
              value={formData.performed_by}
              onChange={(e) =>
                setFormData({ ...formData, performed_by: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#bac9cc] mb-1">
              Service Notes / Observations
            </label>
            <textarea
              rows={2}
              value={formData.technician_notes}
              onChange={(e) =>
                setFormData({ ...formData, technician_notes: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2e45]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-[#bac9cc] hover:text-[#dbe3f3] hover:bg-[#1e2e45]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00e5ff] text-[#070c13] text-xs font-bold font-mono hover:bg-[#00e5ff]/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting ? "Recording..." : "Record Service & Reset"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
