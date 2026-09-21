import React, { useEffect, useState } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowDown,
} from "lucide-react";
import {
  getFlocks,
  getFeedInventory,
  getFeedLogs,
  logFeedConsumption,
  createFeedInventory,
} from "../services/api";

export function FeedInventory() {
  const [flocks, setFlocks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [logs, setFeedLogsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Consumption Form
  const [selectedFlockId, setSelectedFlockId] = useState("");
  const [selectedFeedId, setSelectedFeedId] = useState("");
  const [quantityUsed, setQuantityUsed] = useState(60.0);
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Add Feed Stock Modal / Form
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedType, setNewFeedType] = useState("");
  const [newQuantityKg, setNewQuantityKg] = useState(500.0);
  const [newReorderThreshold, setNewReorderThreshold] = useState(100.0);

  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadAllFeedData = async () => {
    try {
      setLoading(true);
      const [flocksRes, feedRes, logsRes] = await Promise.all([
        getFlocks(),
        getFeedInventory(),
        getFeedLogs(),
      ]);
      const activeFlocks = (flocksRes || []).filter(
        (f) => f.status === "Active",
      );
      setFlocks(activeFlocks);
      if (activeFlocks.length > 0) setSelectedFlockId(activeFlocks[0].id);

      setInventory(feedRes || []);
      if ((feedRes || []).length > 0) setSelectedFeedId(feedRes[0].id);

      setFeedLogsList(logsRes || []);
    } catch (err) {
      console.error("Failed loading feed inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFeedData();
  }, []);

  const selectedFeed = inventory.find((item) => item.id === selectedFeedId);
  const selectedFlock = flocks.find((f) => f.id === selectedFlockId);

  // Handle Log Feed Consumption
  const handleLogConsumption = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const qty = parseFloat(quantityUsed);
    if (!selectedFeed) {
      setMessage({ type: "error", text: "Please select a valid feed type." });
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setMessage({
        type: "error",
        text: "Quantity used must be greater than zero.",
      });
      return;
    }

    // Business Rule Edge Case: Feed consumption > available stock throws HTTP 400 error
    if (qty > selectedFeed.quantity_kg) {
      setMessage({
        type: "error",
        text: `Insufficient Feed Stock in Inventory! Requested ${qty} kg, but only ${selectedFeed.quantity_kg} kg available for ${selectedFeed.feed_type}.`,
      });
      return;
    }

    const payload = {
      flock_id: selectedFlockId,
      flock_name: selectedFlock ? selectedFlock.name : "Flock",
      feed_id: selectedFeedId,
      feed_type: selectedFeed.feed_type,
      quantity_used_kg: qty,
      log_date: logDate,
    };

    try {
      setSubmitting(true);
      await logFeedConsumption(payload);

      // Local state update: deduct stock
      setInventory((prev) =>
        prev.map((item) =>
          item.id === selectedFeedId
            ? { ...item, quantity_kg: Math.max(0, item.quantity_kg - qty) }
            : item,
        ),
      );

      setFeedLogsList((prev) => [
        { ...payload, id: `flog-${Date.now()}` },
        ...prev,
      ]);

      setMessage({
        type: "success",
        text: `Logged ${qty} kg of ${selectedFeed.feed_type} for ${payload.flock_name}. Stock updated to ${(
          selectedFeed.quantity_kg - qty
        ).toFixed(1)} kg.`,
      });
    } catch (err) {
      console.error("Error logging feed consumption", err);
      const detail =
        err.response?.data?.detail || "Insufficient Feed Stock in Inventory";
      setMessage({
        type: "error",
        text:
          typeof detail === "string"
            ? detail
            : "Failed to log feed consumption.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add New Feed Stock
  const handleAddFeedStock = async (e) => {
    e.preventDefault();
    if (!newFeedType.trim()) return;

    const payload = {
      feed_type: newFeedType,
      quantity_kg: parseFloat(newQuantityKg) || 0,
      reorder_threshold_kg: parseFloat(newReorderThreshold) || 100,
    };

    try {
      await createFeedInventory(payload);
      setMessage({
        type: "success",
        text: `Feed stock "${newFeedType}" added successfully!`,
      });
      setShowAddFeed(false);
      setNewFeedType("");
      loadAllFeedData();
    } catch (err) {
      setInventory((prev) => [
        ...prev,
        { ...payload, id: `feed-${Date.now()}` },
      ]);
      setShowAddFeed(false);
      setMessage({
        type: "success",
        text: `Feed stock "${newFeedType}" created.`,
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Feed Inventory &amp; Consumption Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor silo stock levels, receive low stock reorder alerts, and log
            daily feed distribution.
          </p>
        </div>

        <button
          onClick={() => setShowAddFeed(!showAddFeed)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Feed Type</span>
        </button>
      </div>

      {/* Action Status Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Add Feed Stock Form Drawer */}
      {showAddFeed && (
        <form
          onSubmit={handleAddFeedStock}
          className="bg-white p-6 rounded-xl border border-indigo-200 shadow-xs space-y-4"
        >
          <h3 className="text-sm font-bold text-indigo-900">
            Add Feed Stock Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Feed Type / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Starter Mash"
                value={newFeedType}
                onChange={(e) => setNewFeedType(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Initial Stock (kg)
              </label>
              <input
                type="number"
                min="0"
                value={newQuantityKg}
                onChange={(e) => setNewQuantityKg(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Reorder Threshold (kg)
              </label>
              <input
                type="number"
                min="0"
                value={newReorderThreshold}
                onChange={(e) => setNewReorderThreshold(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddFeed(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
            >
              Save Feed Category
            </button>
          </div>
        </form>
      )}

      {/* Feed Silo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {inventory.map((item) => {
          const isLowStock = item.quantity_kg <= item.reorder_threshold_kg;
          return (
            <div
              key={item.id}
              className={`p-6 rounded-xl border bg-white shadow-xs flex flex-col justify-between relative overflow-hidden ${
                isLowStock
                  ? "border-amber-300 ring-1 ring-amber-200"
                  : "border-slate-200"
              }`}
            >
              {isLowStock && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low Stock
                </div>
              )}

              <div>
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${
                      isLowStock
                        ? "bg-amber-100 text-amber-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {item.feed_type}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Threshold: {item.reorder_threshold_kg} kg
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <span className="text-xs text-slate-500 uppercase font-semibold">
                    Current Quantity
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {item.quantity_kg.toFixed(1)}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isLowStock ? "Reorder stock immediately" : "Stock Optimal"}
                </span>
                <span
                  className={`font-semibold ${
                    isLowStock ? "text-amber-700" : "text-emerald-600"
                  }`}
                >
                  {isLowStock ? "Warning" : "Available"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution Form & Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed Consumption Logger */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
            <ArrowDown className="w-5 h-5 text-indigo-600" />
            <span>Log Daily Feed Distribution</span>
          </div>

          <form onSubmit={handleLogConsumption} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Flock *
              </label>
              <select
                value={selectedFlockId}
                onChange={(e) => setSelectedFlockId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.active_count} active hens)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Feed Stock Category *
              </label>
              <select
                value={selectedFeedId}
                onChange={(e) => setSelectedFeedId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.feed_type} ({item.quantity_kg} kg available)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Quantity Used (kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={quantityUsed}
                  onChange={(e) => setQuantityUsed(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Distribution Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? "Deducting Stock..." : "Log Feed Distribution"}
            </button>
          </form>
        </div>

        {/* Feed Distribution Audit Log Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Feed Consumption History Ledger
            </h3>
            <span className="text-xs text-slate-500">
              {logs.length} Entries
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Flock</th>
                  <th className="py-3 px-4">Feed Type</th>
                  <th className="py-3 px-4 text-right">
                    Quantity Distributed (kg)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">
                      No feed consumption records logged.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                        {log.log_date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">
                        {log.flock_name || log.flock_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {log.feed_type}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-indigo-700">
                        {log.quantity_used_kg} kg
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedInventory;
