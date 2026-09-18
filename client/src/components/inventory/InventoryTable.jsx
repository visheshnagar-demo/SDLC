import React, { useState } from "react";
import {
  Package,
  AlertTriangle,
  PlusCircle,
  Search,
  Layers,
  RefreshCw,
} from "lucide-react";

export default function InventoryTable({
  items = [],
  onRecordMovement,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "ALL" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "ALL",
    ...new Set(items.map((i) => i.category).filter(Boolean)),
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-200 overflow-hidden">
      <div className="p-5 bg-amber-50/50 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 text-orange-700" />
          <h2 className="text-xl font-serif font-bold text-orange-950">
            Temple Inventory Catalog
          </h2>
          <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {items.length} SKUs
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
            <input
              type="text"
              placeholder="Search SKU or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-orange-900"
          >
            <option value="ALL">All Categories</option>
            {categories
              .filter((c) => c !== "ALL")
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 border border-orange-200 rounded-lg hover:bg-orange-100 text-orange-700"
              title="Refresh Catalog"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-orange-100/60 text-orange-900 text-xs font-semibold uppercase tracking-wider">
              <th className="p-3.5 border-b border-orange-200">SKU Code</th>
              <th className="p-3.5 border-b border-orange-200">Item Name</th>
              <th className="p-3.5 border-b border-orange-200">Category</th>
              <th className="p-3.5 border-b border-orange-200">
                Current Stock
              </th>
              <th className="p-3.5 border-b border-orange-200">
                Min Threshold
              </th>
              <th className="p-3.5 border-b border-orange-200">Status</th>
              <th className="p-3.5 border-b border-orange-200 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100 text-sm">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="p-8 text-center text-orange-600/70 font-medium"
                >
                  No inventory items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isLowStock =
                  (item.current_stock || 0) <= (item.minimum_threshold || 10);
                return (
                  <tr
                    key={item.id || item.item_code}
                    className="hover:bg-amber-50/50 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-xs font-bold text-orange-900">
                      {item.item_code}
                    </td>
                    <td className="p-3.5 font-medium text-orange-950">
                      {item.item_name}
                      {item.is_precious_asset && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                          Precious Vault
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-xs text-orange-800 font-semibold">
                      {item.category}
                    </td>
                    <td className="p-3.5 font-bold text-orange-950">
                      {item.current_stock} units
                    </td>
                    <td className="p-3.5 text-xs text-orange-600 font-medium">
                      {item.minimum_threshold} units
                    </td>
                    <td className="p-3.5">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1 text-red-600" />{" "}
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() =>
                          onRecordMovement && onRecordMovement(item)
                        }
                        className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 text-xs font-semibold rounded transition-colors flex items-center ml-auto"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" /> Log Movement
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
