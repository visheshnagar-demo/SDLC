import React, { useState, useEffect } from "react";
import { X, Save, Sliders } from "lucide-react";
import { createOrUpdateThreshold } from "../../services/api";

export default function ThresholdEditDrawer({
  isOpen,
  onClose,
  threshold,
  tankId,
  tanks = [],
  onSaved,
}) {
  const [formData, setFormData] = useState({
    tank_id: "",
    parameter_name: "pH",
    min_threshold: "",
    max_threshold: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (threshold) {
      setFormData({
        tank_id: threshold.tank_id || tankId || tanks[0]?.id || "",
        parameter_name: threshold.parameter_name || "pH",
        min_threshold: threshold.min_threshold ?? "",
        max_threshold: threshold.max_threshold ?? "",
        is_active: threshold.is_active ?? true,
      });
    } else {
      setFormData({
        tank_id: tankId || tanks[0]?.id || "",
        parameter_name: "pH",
        min_threshold: "6.8",
        max_threshold: "7.8",
        is_active: true,
      });
    }
  }, [threshold, tankId, tanks]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        tank_id: formData.tank_id || tankId,
        parameter_name: formData.parameter_name,
        min_threshold:
          formData.min_threshold !== ""
            ? parseFloat(formData.min_threshold)
            : null,
        max_threshold:
          formData.max_threshold !== ""
            ? parseFloat(formData.max_threshold)
            : null,
        is_active: formData.is_active,
      };
      const result = await createOrUpdateThreshold(payload);
      if (onSaved) onSaved(result);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to save threshold configuration",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-4 sm:p-0 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141c27] border border-[#1e2e45] sm:border-l sm:border-y-0 sm:border-r-0 rounded-2xl sm:rounded-none sm:rounded-l-2xl w-full max-w-md h-auto sm:h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#1e2e45]">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#00e5ff]" />
              <h3 className="text-lg font-bold font-mono text-[#00e5ff]">
                {threshold?.id
                  ? "Configure Threshold Limits"
                  : "Establish Parameter Limits"}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#bac9cc] hover:text-[#dbe3f3] p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#4c0519]/50 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
              {error}
            </div>
          )}

          <form
            id="threshold-form"
            onSubmit={handleSubmit}
            className="space-y-4 text-xs font-mono"
          >
            <div>
              <label className="block text-[#bac9cc] mb-1">Target Tank</label>
              <select
                value={formData.tank_id}
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
              <label className="block text-[#bac9cc] mb-1">
                Parameter Name *
              </label>
              <select
                value={formData.parameter_name}
                onChange={(e) =>
                  setFormData({ ...formData, parameter_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              >
                <option value="pH">pH Level (Acidity / Alkalinity)</option>
                <option value="Dissolved Oxygen">
                  Dissolved Oxygen (mg/L)
                </option>
                <option value="Temperature">Temperature (°C)</option>
                <option value="Ammonia">Ammonia NH3 (ppm)</option>
                <option value="Salinity">Salinity (ppt)</option>
                <option value="Nitrate">Nitrate NO3 (ppm)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#bac9cc] mb-1">
                  Min Boundary Safe Limit
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 6.8"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, min_threshold: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#bac9cc] mb-1">
                  Max Boundary Safe Limit
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 7.8"
                  value={formData.max_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, max_threshold: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>
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
                <span className="text-[#dbe3f3]">
                  Enable active automated breach notifications
                </span>
              </label>
            </div>
          </form>
        </div>

        <div className="pt-6 border-t border-[#1e2e45] flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono text-[#bac9cc] hover:text-[#dbe3f3] hover:bg-[#1e2e45]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="threshold-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00e5ff] text-[#070c13] text-xs font-bold font-mono hover:bg-[#00e5ff]/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : "Save Threshold"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
