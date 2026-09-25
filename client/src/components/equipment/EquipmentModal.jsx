import React, { useState } from "react";
import { X, Wrench, Save } from "lucide-react";
import { createEquipment } from "../../services/api";

export default function EquipmentModal({
  isOpen,
  onClose,
  tankId,
  tanks = [],
  onEquipmentCreated,
}) {
  const [formData, setFormData] = useState({
    tank_id: tankId || tanks[0]?.id || "",
    name: "Canister Filter B2",
    equipment_type: "Canister Filter",
    model_number: "Fluval FX6",
    maintenance_interval_days: "30",
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
        name: formData.name,
        equipment_type: formData.equipment_type,
        model_number: formData.model_number || null,
        maintenance_interval_days:
          parseInt(formData.maintenance_interval_days, 10) || 30,
      };
      const created = await createEquipment(payload);
      if (onEquipmentCreated) onEquipmentCreated(created);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to register equipment");
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
            <h3 className="text-lg font-bold font-mono text-[#00e5ff]">
              Register Equipment Asset
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
            <label className="block text-[#bac9cc] mb-1">
              Equipment Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Canister Filter B2"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#bac9cc] mb-1">
                Equipment Type *
              </label>
              <select
                value={formData.equipment_type}
                onChange={(e) =>
                  setFormData({ ...formData, equipment_type: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              >
                <option value="Canister Filter">Canister Filter</option>
                <option value="Water Pump">Water Pump</option>
                <option value="Aerator / Air Pump">Aerator / Air Pump</option>
                <option value="Submersible Heater">Submersible Heater</option>
                <option value="UV Sterilizer">UV Sterilizer</option>
                <option value="LED Lighting System">LED Lighting System</option>
                <option value="Auto Feeder">Auto Feeder</option>
              </select>
            </div>

            <div>
              <label className="block text-[#bac9cc] mb-1">
                Interval (Days) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.maintenance_interval_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maintenance_interval_days: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#bac9cc] mb-1">
              Model / Serial Number
            </label>
            <input
              type="text"
              placeholder="e.g. Fluval FX6 #A983"
              value={formData.model_number}
              onChange={(e) =>
                setFormData({ ...formData, model_number: e.target.value })
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
              <span>{isSubmitting ? "Registering..." : "Register Asset"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
