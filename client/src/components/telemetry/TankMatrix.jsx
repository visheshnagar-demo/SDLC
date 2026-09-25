import React, { useState } from "react";
import { Layers, Plus, Droplet } from "lucide-react";
import { createTank } from "../../services/api";

export default function TankMatrix({
  tanks = [],
  selectedTankId,
  onSelectTank,
  onTankCreated,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity_liters: "",
    water_type: "Freshwater",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        location: formData.location || "Main Display Hall",
        capacity_liters: parseFloat(formData.capacity_liters) || 500,
        water_type: formData.water_type,
      };
      const created = await createTank(payload);
      setShowAddModal(false);
      setFormData({
        name: "",
        location: "",
        capacity_liters: "",
        water_type: "Freshwater",
      });
      if (onTankCreated) onTankCreated(created);
      if (onSelectTank) onSelectTank(created.id);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to register aquarium tank",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#00e5ff]" />
          <h2 className="text-base font-bold font-mono text-[#dbe3f3]">
            Monitored Tank Matrix
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141c27] hover:bg-[#1e2e45] text-[#00e5ff] text-xs font-mono font-semibold border border-[#00e5ff]/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tank</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tanks.map((tank) => {
          const isSelected = tank.id === selectedTankId;
          return (
            <button
              key={tank.id}
              type="button"
              onClick={() => onSelectTank(tank.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? "bg-[#1e2e45]/80 border-[#00e5ff] shadow-lg shadow-[#00e5ff]/10"
                  : "bg-[#141c27] border-[#1e2e45] hover:border-[#1e2e45]/80 text-[#bac9cc]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#dbe3f3] font-mono flex items-center gap-1.5">
                  <Droplet
                    className={`w-4 h-4 ${isSelected ? "text-[#00e5ff]" : "text-[#8899a6]"}`}
                  />
                  {tank.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#0c141f] border border-[#1e2e45] font-mono text-[#00e5ff]">
                  {tank.water_type || "Freshwater"}
                </span>
              </div>
              <div className="mt-2 text-xs text-[#bac9cc] flex items-center justify-between font-mono">
                <span>{tank.location || "Main Hall"}</span>
                <span>
                  {tank.capacity_liters ? `${tank.capacity_liters} L` : "N/A"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141c27] border border-[#1e2e45] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-mono text-[#00e5ff]">
              Register New Aquarium Tank
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-[#4c0519]/50 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 text-sm font-mono"
            >
              <div>
                <label className="block text-xs text-[#bac9cc] mb-1">
                  Tank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tank 1 - Coral Reef"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#bac9cc] mb-1">
                  Location / Zone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zone A - Marine Exhibit"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#bac9cc] mb-1">
                    Capacity (Liters)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 500"
                    value={formData.capacity_liters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity_liters: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#bac9cc] mb-1">
                    Water Type
                  </label>
                  <select
                    value={formData.water_type}
                    onChange={(e) =>
                      setFormData({ ...formData, water_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#0c141f] border border-[#1e2e45] text-[#dbe3f3] focus:border-[#00e5ff] focus:outline-none"
                  >
                    <option value="Freshwater">Freshwater</option>
                    <option value="Saltwater / Marine">
                      Saltwater / Marine
                    </option>
                    <option value="Brackish">Brackish</option>
                    <option value="Quarantine">Quarantine</option>
                  </select>
                </div>
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
                  {isSubmitting ? "Registering..." : "Register Tank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
