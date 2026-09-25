import React, { useState } from "react";
import { Radio, X } from "lucide-react";
import { ingestTelemetry } from "../../services/api";

export default function TelemetryIngestModal({
  isOpen,
  onClose,
  tankId,
  tanks = [],
  onIngested,
}) {
  const [selectedTank, setSelectedTank] = useState(
    tankId || tanks[0]?.id || "",
  );
  const [formData, setFormData] = useState({
    ph_level: "7.4",
    dissolved_oxygen: "6.8",
    temperature_c: "25.4",
    ammonia_ppm: "0.02",
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
        tank_id: selectedTank || tankId,
        ph_level: parseFloat(formData.ph_level),
        dissolved_oxygen: parseFloat(formData.dissolved_oxygen),
        temperature_c: parseFloat(formData.temperature_c),
        ammonia_ppm: parseFloat(formData.ammonia_ppm),
      };
      const result = await ingestTelemetry(payload);
      if (onIngested) onIngested(result);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to ingest sensor telemetry data",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#141c27] border border-[#1e2e45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#00e5ff] animate-pulse" />
            <h3 className="text-lg font-bold font-mono text-[#00e5ff]">
              Ingest Sensor Telemetry
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-mono">
          <div>
            <label className="block text-xs text-[#bac9cc] mb-1">
              Select Tank *
            </label>
            <select
              value={selectedTank || tankId}
              onChange={(e) => setSelectedTank(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            >
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.water_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#bac9cc] mb-1">
                pH Level
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.ph_level}
                onChange={(e) =>
                  setFormData({ ...formData, ph_level: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-1">
                Dissolved O2 (mg/L)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.dissolved_oxygen}
                onChange={(e) =>
                  setFormData({ ...formData, dissolved_oxygen: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#bac9cc] mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.temperature_c}
                onChange={(e) =>
                  setFormData({ ...formData, temperature_c: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-1">
                Ammonia (ppm)
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={formData.ammonia_ppm}
                onChange={(e) =>
                  setFormData({ ...formData, ammonia_ppm: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
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
              className="px-4 py-2 rounded-lg bg-[#00e5ff] text-[#070c13] text-xs font-bold font-mono hover:bg-[#00e5ff]/90 disabled:opacity-50"
            >
              {isSubmitting ? "Transmitting..." : "Transmit Telemetry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
