import React, { useEffect, useState } from "react";
import ChipDefinitionCard from "../components/inventory/ChipDefinitionCard";
import BatchTable from "../components/inventory/BatchTable";
import { fetchChips, createChip, addChipBatch } from "../services/api";
import { Layers, Plus, RefreshCcw, X, CheckCircle2 } from "lucide-react";

export const InventoryPage = () => {
  const [chips, setChips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChipModal, setShowAddChipModal] = useState(false);
  const [selectedChipForBatch, setSelectedChipForBatch] = useState(null);

  // New Chip Form state
  const [chipName, setChipName] = useState("");
  const [category, setCategory] = useState("STANDARD");
  const [faceValue, setFaceValue] = useState(100);

  // New Batch Form state
  const [batchNumber, setBatchNumber] = useState("BATCH-2026-003");
  const [batchQuantity, setBatchQuantity] = useState(50000);
  const [trayLocation, setTrayLocation] = useState("Vault Gamma - Tray 02");

  const [modalStatus, setModalStatus] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchChips();
      setChips(data);
    } catch (err) {
      console.error("Failed to load chips inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChip = async (e) => {
    e.preventDefault();
    setModalStatus(null);
    try {
      await createChip({
        name: chipName,
        category: category,
        face_value: Number(faceValue),
        status: "Active",
      });
      setModalStatus({
        type: "success",
        text: "Chip definition created successfully!",
      });
      setShowAddChipModal(false);
      setChipName("");
      loadData();
    } catch (err) {
      console.error("Error creating chip:", err);
      setModalStatus({
        type: "error",
        text: err.response?.data?.detail || "Failed to create chip",
      });
    }
  };

  const handleAddBatchSubmit = async (e) => {
    e.preventDefault();
    setModalStatus(null);
    try {
      await addChipBatch(selectedChipForBatch.id, {
        batch_number: batchNumber,
        total_quantity: Number(batchQuantity),
        tray_location: trayLocation,
      });
      setModalStatus({
        type: "success",
        text: "Inventory batch added successfully!",
      });
      setSelectedChipForBatch(null);
      loadData();
    } catch (err) {
      console.error("Error adding batch:", err);
      setModalStatus({
        type: "error",
        text: err.response?.data?.detail || "Failed to add batch",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Chip Catalog & Vault Batches
          </h1>
          <p className="text-sm text-slate-400">
            Manage chip definitions, total supply, and stock batch allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddChipModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chip Definition
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all"
          >
            <RefreshCcw
              className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {chips.map((chip) => (
          <ChipDefinitionCard
            key={chip.id}
            chip={chip}
            onAddBatch={(c) => setSelectedChipForBatch(c)}
          />
        ))}
      </div>

      <BatchTable />

      {/* Modal: New Chip */}
      {showAddChipModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Add Chip Definition
              </h3>
              <button
                onClick={() => setShowAddChipModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Chip Name
                </label>
                <input
                  type="text"
                  required
                  value={chipName}
                  onChange={(e) => setChipName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Diamond 5000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="STANDARD">STANDARD</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="VIP">VIP</option>
                  <option value="HIGH_ROLLER">HIGH_ROLLER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Face Value ($)
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={faceValue}
                  onChange={(e) => setFaceValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddChipModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold shadow-lg shadow-cyan-500/20"
                >
                  Create Chip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Batch */}
      {selectedChipForBatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Add Stock Batch for{" "}
                <span className="text-cyan-400">
                  {selectedChipForBatch.name}
                </span>
              </h3>
              <button
                onClick={() => setSelectedChipForBatch(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Batch Number
                </label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Batch Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Vault Tray Location
                </label>
                <input
                  type="text"
                  required
                  value={trayLocation}
                  onChange={(e) => setTrayLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedChipForBatch(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold shadow-lg shadow-cyan-500/20"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
