import React, { useState } from "react";
import { X, HeartPulse, Save } from "lucide-react";
import { createHealthRecord } from "../../services/api";

export default function HealthRecordModal({
  isOpen,
  onClose,
  tankId,
  tanks = [],
  onRecordCreated,
}) {
  const [formData, setFormData] = useState({
    tank_id: tankId || tanks[0]?.id || "",
    species: "Neon Tetra (Paracheirodon innesi)",
    population_count: "10",
    health_status: "Healthy",
    symptoms: "",
    treatment_notes:
      "Routine preventative inspection applied, healthy status confirmed.",
    is_quarantined: false,
    recorded_by: "Dr. Elena Rostova",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        tank_id: formData.tank_id || tankId,
        species: formData.species,
        population_count: parseInt(formData.population_count, 10) || 1,
        health_status: formData.health_status,
        symptoms: formData.symptoms || null,
        treatment_notes: formData.treatment_notes || null,
        is_quarantined: formData.is_quarantined,
        recorded_by: formData.recorded_by,
      };
      const created = await createHealthRecord(payload);
      if (onRecordCreated) onRecordCreated(created);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to log health observation",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#141c27] border border-[#1e2e45] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2e45]">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#00e5ff]" />
            <h3 className="text-lg font-bold font-mono text-[#00e5ff]">
              Log Fish Health Observation
            </h3>
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
              Target Aquarium Tank
            </label>
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
                Species Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Discus (Symphysodon)"
                value={formData.species}
                onChange={(e) =>
                  setFormData({ ...formData, species: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#bac9cc] mb-1">
                Specimen Count *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.population_count}
                onChange={(e) =>
                  setFormData({ ...formData, population_count: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#bac9cc] mb-1">
                Health Status *
              </label>
              <select
                value={formData.health_status}
                onChange={(e) =>
                  setFormData({ ...formData, health_status: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              >
                <option value="Healthy">Healthy / Robust</option>
                <option value="Monitoring">Monitoring (Mild Stress)</option>
                <option value="Treatment">Under Active Treatment</option>
                <option value="Critical">Critical Disease State</option>
              </select>
            </div>
            <div>
              <label className="block text-[#bac9cc] mb-1">Inspected By</label>
              <input
                type="text"
                required
                value={formData.recorded_by}
                onChange={(e) =>
                  setFormData({ ...formData, recorded_by: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#bac9cc] mb-1">
              Symptoms (if any)
            </label>
            <input
              type="text"
              placeholder="e.g. White spots on dorsal fin, rapid opercular movement"
              value={formData.symptoms}
              onChange={(e) =>
                setFormData({ ...formData, symptoms: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#bac9cc] mb-1">
              Treatment / Notes
            </label>
            <textarea
              rows={2}
              value={formData.treatment_notes}
              onChange={(e) =>
                setFormData({ ...formData, treatment_notes: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_quarantined}
                onChange={(e) =>
                  setFormData({ ...formData, is_quarantined: e.target.checked })
                }
                className="rounded bg-[#0c141f] border-[#1e2e45] text-[#fbbf24] focus:ring-0"
              />
              <span className="text-[#fbbf24] font-bold">
                Transfer / Maintain in Quarantine Tank (Isolation)
              </span>
            </label>
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
              <span>{isSubmitting ? "Logging..." : "Save Health Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
