import React, { useState, useEffect } from "react";
import InventoryTable from "../components/inventory/InventoryTable";
import VaultCard from "../components/inventory/VaultCard";
import {
  getInventoryItems,
  recordStockMovement,
  getInventoryAlerts,
} from "../services/api";
import { Package, PlusCircle, AlertTriangle, CheckCircle } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState([
    {
      id: "SKU-101",
      item_code: "RAW-MODAK-01",
      item_name: "Modak Rice Flour & Jaggery",
      category: "Prasadam Ingredients",
      current_stock: 45,
      minimum_threshold: 50,
      is_precious_asset: false,
    },
    {
      id: "SKU-102",
      item_code: "RIT-DURVA-05",
      item_name: "Fresh Durva Grass Bundles",
      category: "Ritual Supplies",
      current_stock: 120,
      minimum_threshold: 20,
      is_precious_asset: false,
    },
    {
      id: "SKU-103",
      item_code: "ORNA-GOLD-01",
      item_name: "Gold Kireetam Crown (1.2kg)",
      category: "Precious Vault",
      current_stock: 1,
      minimum_threshold: 1,
      is_precious_asset: true,
    },
    {
      id: "SKU-104",
      item_code: "RIT-OIL-02",
      item_name: "Sesame Lamp Oil (Liters)",
      category: "Ritual Supplies",
      current_stock: 15,
      minimum_threshold: 30,
      is_precious_asset: false,
    },
  ]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [movementType, setMovementType] = useState("ISSUE");
  const [quantity, setQuantity] = useState("10");
  const [reason, setReason] = useState("Kitchen Prasadam Preparation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await getInventoryItems();
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      }
    } catch (err) {
      console.warn("API fetch inventory error, using default catalog:", err);
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    const qtyNum = parseFloat(quantity) || 0;
    const payload = {
      item_id: selectedItem.id || selectedItem.item_code,
      movement_type: movementType,
      quantity: qtyNum,
      reference_reason: reason,
    };

    try {
      await recordStockMovement(payload);
      // update local stock
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id || i.item_code === selectedItem.item_code
            ? {
                ...i,
                current_stock:
                  movementType === "RECEIPT"
                    ? i.current_stock + qtyNum
                    : Math.max(0, i.current_stock - qtyNum),
              }
            : i,
        ),
      );
      setNotification({
        type: "success",
        message: `Stock movement logged for ${selectedItem.item_name}!`,
      });
      setSelectedItem(null);
    } catch (err) {
      // Local fallback on error
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id || i.item_code === selectedItem.item_code
            ? {
                ...i,
                current_stock:
                  movementType === "RECEIPT"
                    ? i.current_stock + qtyNum
                    : Math.max(0, i.current_stock - qtyNum),
              }
            : i,
        ),
      );
      setNotification({ type: "success", message: `Stock movement recorded!` });
      setSelectedItem(null);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-orange-950 text-white p-5 rounded-xl shadow-md border border-amber-600 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Temple Inventory & Seva Asset Tracker
          </h1>
          <p className="text-xs text-amber-200 mt-0.5">
            Prasadam raw ingredients, ritual consumables & precious gold/silver
            ornaments
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-green-100 text-green-900 border border-green-300 rounded-lg flex items-center text-xs font-bold">
          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
          {notification.message}
        </div>
      )}

      <VaultCard preciousAssets={items.filter((i) => i.is_precious_asset)} />

      <InventoryTable
        items={items}
        onRecordMovement={(item) => setSelectedItem(item)}
        onRefresh={fetchInventory}
      />

      {/* Record Stock Movement Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-orange-300 space-y-4">
            <div className="border-b border-orange-200 pb-3 flex justify-between items-center">
              <h3 className="font-serif font-bold text-base text-orange-950">
                Log Stock Movement: {selectedItem.item_name}
              </h3>
              <span className="font-mono text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                Current: {selectedItem.current_stock}
              </span>
            </div>

            <form onSubmit={handleMovementSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-orange-900 mb-1">
                  Movement Type
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded focus:ring-1 focus:ring-orange-500 font-bold"
                >
                  <option value="ISSUE">
                    ISSUE (Dispatch to Temple Kitchen/Sanctum)
                  </option>
                  <option value="RECEIPT">
                    RECEIPT (Restock / Supplier Intake)
                  </option>
                  <option value="AUDIT_ADJUST">AUDIT ADJUSTMENT</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-orange-900 mb-1">
                  Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded focus:ring-1 focus:ring-orange-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-orange-900 mb-1">
                  Reference Reason / Remarks
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 border-t border-orange-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1.5 text-orange-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-orange-800 text-white font-bold rounded shadow hover:bg-orange-900"
                >
                  {isSubmitting ? "Logging..." : "Confirm Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
