import React, { useState } from "react";
import { Package, Plus } from "lucide-react";
import ProductCatalogGrid from "../components/products/ProductCatalogGrid.jsx";

export default function ProductCatalogPage({
  products = [],
  warranties = [],
  loading = false,
  onOpenRegisterModal = () => {},
  onDeleteProduct = () => {},
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Registered Products ({products.length})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse all your registered devices, appliances, and items with
            active warranty statuses.
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Product</span>
        </button>
      </div>

      <ProductCatalogGrid
        products={products}
        warranties={warranties}
        loading={loading}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenRegisterModal={onOpenRegisterModal}
        onDeleteProduct={onDeleteProduct}
      />
    </div>
  );
}
