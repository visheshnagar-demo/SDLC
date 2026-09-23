import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, Package, ArrowLeft, Plus } from "lucide-react";
import WarrantyTimeline from "../components/warranties/WarrantyTimeline.jsx";
import DocumentVault from "../components/warranties/DocumentVault.jsx";

export default function WarrantyDetailsPage({
  products = [],
  warranties = [],
  documents = [],
  loading = false,
  onUploadDocument = async () => {},
  onDeleteDocument = async () => {},
  onUpdateWarranty = async () => {},
  onOpenRegisterModal = () => {},
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProductId =
    searchParams.get("product") || (products.length > 0 ? products[0].id : "");
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);

  useEffect(() => {
    const paramId = searchParams.get("product");
    if (paramId && paramId !== selectedProductId) {
      setSelectedProductId(paramId);
    } else if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [searchParams, products]);

  const handleSelectProduct = (id) => {
    setSelectedProductId(id);
    setSearchParams({ product: id });
  };

  const currentProduct =
    products.find((p) => p.id === selectedProductId) || products[0];
  const currentWarranty = warranties.find(
    (w) => w.product_id === currentProduct?.id,
  );
  const currentDocs = documents.filter(
    (d) => d.product_id === currentProduct?.id,
  );

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64"></div>
        <div className="h-64 bg-slate-100 rounded-2xl"></div>
        <div className="h-64 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          No Products to Track
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Register a product first to view its warranty timeline, expiration
          alerts, and manage proof of purchase documents.
        </p>
        <button
          onClick={onOpenRegisterModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Product</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Product Selector */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Warranty Details & Document Management
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            {currentProduct
              ? `${currentProduct.name} (${currentProduct.brand})`
              : "Warranty Details"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="product-select"
            className="text-xs font-semibold text-slate-600"
          >
            Select Product:
          </label>
          <select
            id="product-select"
            value={selectedProductId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.brand} (SN: {p.serial_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Timeline & Document Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WarrantyTimeline
          product={currentProduct}
          warranty={currentWarranty}
          onUpdateWarranty={onUpdateWarranty}
        />

        <DocumentVault
          productId={currentProduct?.id}
          documents={currentDocs}
          onUploadDocument={onUploadDocument}
          onDeleteDocument={onDeleteDocument}
        />
      </div>
    </div>
  );
}
