import React, { useState, useEffect } from "react";
import {
  getChips,
  createChip,
  addInventoryBatch,
  updateChipStatus,
} from "../services/api";
import {
  Plus,
  Package,
  Layers,
  Activity,
  CheckCircle,
  ShieldAlert,
  Archive,
} from "lucide-react";

export default function InventoryManager() {
  const [chips, setChips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Forms state
  const [showCreateChipModal, setShowCreateChipModal] = useState(false);
  const [newChip, setNewChip] = useState({
    name: "",
    category: "STANDARD",
    face_value: 100,
  });

  const [selectedChipForBatch, setSelectedChipForBatch] = useState(null);
  const [newBatch, setNewChipBatch] = useState({
    batch_number: "",
    total_quantity: 1000,
  });

  const fetchChipsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChips();
      setChips(data);
    } catch (err) {
      console.error("Error fetching chip definitions:", err);
      setError("Failed to fetch chip inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChipsList();
  }, []);

  const handleCreateChip = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await createChip({
        name: newChip.name,
        category: newChip.category,
        face_value: parseFloat(newChip.face_value),
      });
      setSuccessMsg(`Chip "${newChip.name}" created successfully!`);
      setShowCreateChipModal(false);
      setNewChip({ name: "", category: "STANDARD", face_value: 100 });
      fetchChipsList();
    } catch (err) {
      console.error("Error creating chip:", err);
      setError(
        err.response?.data?.detail || "Failed to create chip definition.",
      );
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!selectedChipForBatch) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await addInventoryBatch(selectedChipForBatch.id, {
        batch_number: newBatch.batch_number,
        total_quantity: parseInt(newBatch.total_quantity, 10),
      });
      setSuccessMsg(`Batch "${newBatch.batch_number}" added successfully!`);
      setSelectedChipForBatch(null);
      setNewChipBatch({ batch_number: "", total_quantity: 1000 });
      fetchChipsList();
    } catch (err) {
      console.error("Error adding batch:", err);
      setError(err.response?.data?.detail || "Failed to add inventory batch.");
    }
  };

  const handleStatusChange = async (chipId, newStatus) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await updateChipStatus(chipId, newStatus);
      setSuccessMsg(`Chip status updated to ${newStatus}`);
      fetchChipsList();
    } catch (err) {
      console.error("Error updating chip status:", err);
      setError(err.response?.data?.detail || "Failed to update chip status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Package className="w-7 h-7 text-cyan-400" />
            Chip Inventory & Vault Stock
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage chip categories, face values, inventory batches, and
            lifecycle status
          </p>
        </div>
        <button
          onClick={() => setShowCreateChipModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Create New Chip Type
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm">
          {successMsg}
        </div>
      )}

      {/* Chip Types Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          Loading chip inventory...
        </div>
      ) : chips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chips.map((chip) => (
            <div
              key={chip.id}
              className="bg-slate-800/80 rounded-xl border border-slate-700 p-5 space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-cyan-400" />
                      {chip.name}
                    </h3>
                    <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 mt-1 inline-block">
                      {chip.category}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                      chip.status === "ACTIVE"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : chip.status === "SUSPENDED"
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-slate-900 text-slate-400 border-slate-700"
                    }`}
                  >
                    {chip.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Face Value
                    </span>
                    <span className="font-bold text-cyan-300">
                      ${chip.face_value.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Total Quantity
                    </span>
                    <span className="font-bold text-white">
                      {(chip.total_quantity ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Available
                    </span>
                    <span className="font-bold text-emerald-400">
                      {(chip.available_quantity ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Allocated
                    </span>
                    <span className="font-bold text-indigo-300">
                      {(chip.allocated_quantity ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Batches Sub-list */}
                {chip.batches?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Batches ({chip.batches.length})
                    </span>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {chip.batches.map((b) => (
                        <div
                          key={b.id}
                          className="text-xs flex justify-between bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-700/50"
                        >
                          <span className="font-mono text-cyan-300">
                            {b.batch_number}
                          </span>
                          <span className="text-slate-300">
                            Available:{" "}
                            <strong className="text-emerald-400">
                              {b.available_quantity}
                            </strong>{" "}
                            / {b.total_quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-700 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => {
                    setSelectedChipForBatch(chip);
                    setNewChipBatch({
                      batch_number: `BATCH-${Date.now().toString().slice(-4)}`,
                      total_quantity: 1000,
                    });
                  }}
                  className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded transition text-center"
                >
                  + Add Stock Batch
                </button>
                {chip.status === "ACTIVE" ? (
                  <button
                    onClick={() => handleStatusChange(chip.id, "SUSPENDED")}
                    className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded border border-amber-800 transition"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(chip.id, "ACTIVE")}
                    className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800 transition"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 bg-slate-800/40 rounded-xl border border-slate-700">
          No chip definitions found. Click "Create New Chip Type" to add one.
        </div>
      )}

      {/* Create Chip Modal */}
      {showCreateChipModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-cyan-400">
              Create New Chip Definition
            </h2>
            <form onSubmit={handleCreateChip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Chip Name
                </label>
                <input
                  type="text"
                  required
                  value={newChip.name}
                  onChange={(e) =>
                    setNewChip({ ...newChip, name: e.target.value })
                  }
                  placeholder="e.g., Premium Gold 100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={newChip.category}
                  onChange={(e) =>
                    setNewChip({ ...newChip, category: e.target.value })
                  }
                  placeholder="e.g., STANDARD, PREMIUM, CASINO"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Face Value ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newChip.face_value}
                  onChange={(e) =>
                    setNewChip({ ...newChip, face_value: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChipModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-lg"
                >
                  Save Chip Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {selectedChipForBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-cyan-400">
              Add Stock Batch for {selectedChipForBatch.name}
            </h2>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Batch Number
                </label>
                <input
                  type="text"
                  required
                  value={newBatch.batch_number}
                  onChange={(e) =>
                    setNewChipBatch({
                      ...newBatch,
                      batch_number: e.target.value,
                    })
                  }
                  placeholder="e.g. BATCH-2026-A1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newBatch.total_quantity}
                  onChange={(e) =>
                    setNewChipBatch({
                      ...newBatch,
                      total_quantity: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedChipForBatch(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-lg"
                >
                  Add Inventory Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
