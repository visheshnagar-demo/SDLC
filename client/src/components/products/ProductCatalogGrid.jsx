import React from "react";
import {
  Package,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Plus,
  Calendar,
  DollarSign,
  Tag,
  Hash,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ProductCatalogGrid({
  products = [],
  warranties = [],
  loading = false,
  selectedCategory = "All",
  onSelectCategory = () => {},
  onOpenRegisterModal = () => {},
  onDeleteProduct = () => {},
}) {
  const categories = [
    "All",
    "Electronics",
    "Computing",
    "Home Appliances",
    "Automotive",
    "Tools",
    "Other",
  ];

  const getWarrantyForProduct = (productId) => {
    return warranties.find((w) => w.product_id === productId);
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "All") return true;
    return product.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse space-y-4"
          >
            <div className="h-5 bg-slate-200 rounded w-2/3"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            <div className="h-16 bg-slate-50 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No products found
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {selectedCategory === "All"
              ? "You have not registered any products yet. Add your first item to start tracking warranties."
              : `No products registered under the "${selectedCategory}" category.`}
          </p>
          <button
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Product</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const warranty = getWarrantyForProduct(product.id);
            const isExpired = warranty?.status?.toLowerCase() === "expired";
            const isActive =
              warranty?.status?.toLowerCase() === "active" ||
              (!isExpired && warranty);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                      {product.category || "General"}
                    </span>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-4">
                    {product.brand || "Brand"}
                  </p>

                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Hash className="w-3.5 h-3.5" /> Serial No:
                      </span>
                      <span className="font-mono font-medium text-slate-700">
                        {product.serial_number || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" /> Purchased:
                      </span>
                      <span className="font-medium text-slate-700">
                        {product.purchase_date || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <DollarSign className="w-3.5 h-3.5" /> Price:
                      </span>
                      <span className="font-semibold text-slate-900">
                        $
                        {typeof product.purchase_price === "number"
                          ? product.purchase_price.toFixed(2)
                          : product.purchase_price || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Warranty Status Banner */}
                  <div className="mb-4">
                    {warranty ? (
                      <div
                        className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium ${
                          isExpired
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isExpired ? (
                            <ShieldX className="w-4 h-4 text-rose-600" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          )}
                          <span>
                            {isExpired ? "Warranty Expired" : "Active Warranty"}
                          </span>
                        </div>
                        <span className="font-bold">
                          {warranty.expiration_date
                            ? `Exp: ${warranty.expiration_date}`
                            : "Active"}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-between text-xs border border-slate-200">
                        <span>No warranty record</span>
                        <Link
                          to={`/warranties?product=${product.id}`}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          Add Warranty
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/warranties?product=${product.id}`}
                    className="flex-1 text-center py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Warranty & Docs
                  </Link>
                  <Link
                    to={`/claims?product=${product.id}`}
                    className="flex-1 text-center py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    File / View Claim
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
