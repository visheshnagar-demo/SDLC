import React, { useEffect, useState } from "react";
import FilterRow from "../components/catalog/FilterRow";
import ItemCatalogTable from "../components/catalog/ItemCatalogTable";
import { getItems, createItem, updateItem } from "../services/api";
import { X, Plus, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([
    {
      id: "1",
      sku: "SKU-9901",
      name: "Heavy Duty Police Tactical Vest",
      category: "Protective Gear",
      unit_price: 250.0,
      reorder_threshold: 10,
      reorder_quantity: 50,
    },
    {
      id: "2",
      sku: "SKU-8820",
      name: "Body Cam Model X-2",
      category: "Surveillance",
      unit_price: 450.0,
      reorder_threshold: 8,
      reorder_quantity: 25,
    },
    {
      id: "3",
      sku: "SKU-7715",
      name: "Patrol Vehicle Radio Set",
      category: "Communications",
      unit_price: 600.0,
      reorder_threshold: 5,
      reorder_quantity: 15,
    },
    {
      id: "4",
      sku: "SKU-6604",
      name: "High-Lumen Tactical Flashlight",
      category: "Field Supplies",
      unit_price: 45.0,
      reorder_threshold: 15,
      reorder_quantity: 60,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "General",
    unit_price: 0,
    reorder_threshold: 10,
    reorder_quantity: 50,
  });

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const fetchCatalogItems = async () => {
    setLoading(true);
    try {
      const data = await getItems();
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      }
    } catch (err) {
      console.warn("Items fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogItems();
  }, []);

  const categories = Array.from(
    new Set(items.map((i) => i.category || "General")),
  );

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || (item.category || "General") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      category: "General",
      unit_price: 50,
      reorder_threshold: 10,
      reorder_quantity: 50,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku || "",
      name: item.name || "",
      category: item.category || "General",
      unit_price: item.unit_price || 0,
      reorder_threshold: item.reorder_threshold || 10,
      reorder_quantity: item.reorder_quantity || 50,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.sku || !formData.name) {
      setFormError("SKU and Item Name are required fields.");
      return;
    }

    setFormLoading(true);

    try {
      if (editingItem) {
        const updated = await updateItem(editingItem.id, formData);
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id ? { ...i, ...formData } : i,
          ),
        );
      } else {
        const created = await createItem(formData);
        setItems((prev) => [
          created.id ? created : { ...formData, id: String(Date.now()) },
          ...prev,
        ]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Catalog submit error:", err);
      setFormError(
        err.message || "Failed to save item. Please verify API response.",
      );
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Item Catalog Management
        </h1>
        <p className="text-sm text-slate-500">
          Configure SKUs, pricing, categories, and reorder threshold parameters.
        </p>
      </div>

      <FilterRow
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        onAddNew={handleOpenAdd}
      />

      <ItemCatalogTable
        items={filteredItems}
        loading={loading}
        onEditItem={handleOpenEdit}
      />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingItem ? "Edit Item Parameters" : "Add New Catalog Item"}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorder_threshold: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Reorder Qty
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorder_quantity: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
