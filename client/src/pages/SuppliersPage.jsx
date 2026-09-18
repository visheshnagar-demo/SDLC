import React, { useState, useEffect } from "react";
import { Plus, Building2 } from "lucide-react";
import SupplierCard from "../components/suppliers/SupplierCard";
import AddSupplierModal from "../components/suppliers/AddSupplierModal";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/api";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers({ limit: 100 });
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (formData) => {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      alert("Error saving supplier: " + (err.message || "Failed"));
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (
      !window.confirm("Are you sure you want to remove this supplier profile?")
    )
      return;
    try {
      await deleteSupplier(id);
      loadSuppliers();
    } catch (err) {
      alert("Error deleting supplier: " + (err.message || "Failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Supplier Partner Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Maintain wholesale supplier contact profiles and lead time details.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg">
            No Suppliers Configured
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Get started by adding wholesale flower suppliers to link with
            catalog listings.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add First Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id || supplier.name}
              supplier={supplier}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteSupplier}
            />
          ))}
        </div>
      )}

      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        initialData={editingSupplier}
      />
    </div>
  );
}
