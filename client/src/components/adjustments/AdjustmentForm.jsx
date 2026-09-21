import React, { useState } from "react";
import { SlidersHorizontal, AlertCircle, CheckCircle2 } from "lucide-react";
import { adjustStock } from "../../services/api";

export default function AdjustmentForm({
  items = [],
  warehouses = [],
  onAdjustmentSuccess = () => {},
}) {
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [delta, setDelta] = useState(0);
  const [reasonCode, setReasonCode] = useState("CYCLE_COUNT");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const reasonOptions = [
    { value: "CYCLE_COUNT", label: "Cycle Count / Inventory Audit" },
    { value: "DAMAGED_GOODS", label: "Damaged Goods / Scrap" },
    { value: "SHIPMENT_ARRIVED", label: "Shipment Received / Restock" },
    { value: "STOCK_TRANSFER", label: "Warehouse Transfer" },
    { value: "CUSTOMER_RETURN", label: "Customer Return" },
    { value: "OTHER", label: "Other Manual Adjustment" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!itemId) {
      setErrorMsg("Please select an item.");
      return;
    }
    if (!warehouseId) {
      setErrorMsg("Please select a warehouse.");
      return;
    }
    if (delta === 0) {
      setErrorMsg("Quantity change delta cannot be zero.");
      return;
    }

    setLoading(true);

    try {
      const selectedItem = items.find((i) => i.id === itemId);
      const selectedWh = warehouses.find((w) => w.id === warehouseId);

      const payload = {
        item_id: itemId,
        warehouse_id: warehouseId,
        quantity_delta: Number(delta),
        reason_code: reasonCode,
        notes:
          notes ||
          `Adjustment for ${selectedItem?.sku || "item"} at ${selectedWh?.name || "warehouse"}`,
      };

      const result = await adjustStock(payload);
      setSuccessMsg(
        `Stock adjustment successfully recorded! Log ID: ${result.id || "N/A"}`,
      );

      // Reset form
      setDelta(0);
      setNotes("");
      onAdjustmentSuccess(result);
    } catch (err) {
      console.error("Stock adjustment error:", err);
      setErrorMsg(
        err.message || "Failed to submit stock adjustment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-4">
        <SlidersHorizontal className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900 text-base">
          Record Stock Adjustment
        </h3>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Error: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Item *
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Choose Item --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} - {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Warehouse Location *
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Choose Warehouse --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quantity Delta (e.g. +50 or -2) *
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Use positive numbers to add stock, negative to subtract stock.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason Code *
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {reasonOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Audit Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Physical inventory count reconciliation"
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Recording Adjustment..." : "Submit Adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}
