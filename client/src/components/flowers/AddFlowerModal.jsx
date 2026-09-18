import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AddFlowerModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  suppliers = [],
}) {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    color: "Red",
    price_per_stem: 2.5,
    stock_quantity: 100,
    low_stock_threshold: 20,
    freshness_date: new Date().toISOString().split("T")[0],
    care_instructions: "Keep stems trimmed in clean water at 40°F.",
    supplier_id: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        species: initialData.species || "",
        color: initialData.color || "Red",
        price_per_stem: initialData.price_per_stem ?? 2.5,
        stock_quantity: initialData.stock_quantity ?? 100,
        low_stock_threshold: initialData.low_stock_threshold ?? 20,
        freshness_date:
          initialData.freshness_date || new Date().toISOString().split("T")[0],
        care_instructions: initialData.care_instructions || "",
        supplier_id: initialData.supplier_id || "",
      });
    } else {
      setFormData({
        name: "",
        species: "",
        color: "Red",
        price_per_stem: 2.5,
        stock_quantity: 100,
        low_stock_threshold: 20,
        freshness_date: new Date().toISOString().split("T")[0],
        care_instructions: "Keep stems trimmed in clean water at 40°F.",
        supplier_id: suppliers[0]?.id || "",
      });
    }
    setError("");
  }, [initialData, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Flower name is required.");
      return;
    }

    if (formData.price_per_stem < 0) {
      setError("Price per stem cannot be negative.");
      return;
    }

    if (formData.stock_quantity < 0) {
      setError("Stock quantity cannot be negative.");
      return;
    }

    onSave({
      ...formData,
      price_per_stem: parseFloat(formData.price_per_stem),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      low_stock_threshold: parseInt(formData.low_stock_threshold, 10),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">
            {initialData ? "Edit Flower Listing" : "Add New Flower Listing"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium"
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Flower Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Red Roses"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Species / Botanical
              </label>
              <input
                type="text"
                placeholder="e.g. Rosa rubiginosa"
                value={formData.species}
                onChange={(e) =>
                  setFormData({ ...formData, species: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                placeholder="e.g. Red, White, Pink"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price / Stem ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_per_stem}
                onChange={(e) =>
                  setFormData({ ...formData, price_per_stem: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Initial Stock Units
              </label>
              <input
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    low_stock_threshold: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Freshness Date
              </label>
              <input
                type="date"
                value={formData.freshness_date}
                onChange={(e) =>
                  setFormData({ ...formData, freshness_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {suppliers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Care Instructions
            </label>
            <textarea
              rows="2"
              placeholder="Care and maintenance guidelines..."
              value={formData.care_instructions}
              onChange={(e) =>
                setFormData({ ...formData, care_instructions: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Save Flower
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
