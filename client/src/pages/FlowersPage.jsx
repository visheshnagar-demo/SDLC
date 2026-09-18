import React, { useState, useEffect } from "react";
import FlowerTable from "../components/flowers/FlowerTable";
import AddFlowerModal from "../components/flowers/AddFlowerModal";
import {
  getFlowers,
  createFlower,
  updateFlower,
  deleteFlower,
  getSuppliers,
} from "../services/api";

export default function FlowersPage() {
  const [flowers, setFlowers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlower, setEditingFlower] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flowersData, suppliersData] = await Promise.all([
        getFlowers({ limit: 100 }),
        getSuppliers({ limit: 100 }),
      ]);
      setFlowers(Array.isArray(flowersData) ? flowersData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (err) {
      console.error("Error loading flowers page:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFlower(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flower) => {
    setEditingFlower(flower);
    setIsModalOpen(true);
  };

  const handleSaveFlower = async (formData) => {
    try {
      if (editingFlower) {
        await updateFlower(editingFlower.id, formData);
      } else {
        await createFlower(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert("Error saving flower: " + (err.message || "Operation failed"));
    }
  };

  const handleDeleteFlower = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this flower catalog item?",
      )
    )
      return;
    try {
      await deleteFlower(id);
      loadData();
    } catch (err) {
      alert("Error deleting flower: " + (err.message || "Operation failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Flower Catalog &amp; Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage flower listings, botanical taxonomy, unit pricing, stock
            levels, and freshness tracking.
          </p>
        </div>
      </div>

      <FlowerTable
        flowers={flowers}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteFlower}
        onAddNew={handleOpenAdd}
      />

      <AddFlowerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFlower}
        initialData={editingFlower}
        suppliers={suppliers}
      />
    </div>
  );
}
