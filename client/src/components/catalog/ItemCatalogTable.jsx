import React from "react";
import { Edit2, PackageCheck, AlertCircle } from "lucide-react";

export default function ItemCatalogTable({
  items = [],
  loading = false,
  onEditItem = () => {},
}) {
  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
        Loading catalog items...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
        No catalog items found matching criteria.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3.5">SKU</th>
              <th className="px-6 py-3.5">Item Name</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5 text-right">Unit Price</th>
              <th className="px-6 py-3.5 text-right">Threshold</th>
              <th className="px-6 py-3.5 text-right">Reorder Qty</th>
              <th className="px-6 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((item) => (
              <tr
                key={item.id || item.sku}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-600">
                  {item.sku}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {item.category || "General"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-900">
                  $
                  {typeof item.unit_price === "number"
                    ? item.unit_price.toFixed(2)
                    : item.unit_price}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-slate-700">
                    {item.reorder_threshold}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-slate-600">
                  {item.reorder_quantity || 0}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onEditItem(item)}
                    className="inline-flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
