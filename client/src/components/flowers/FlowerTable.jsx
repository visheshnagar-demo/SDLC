import React, { useState } from "react";
import { Search, AlertTriangle, Edit2, Trash2, Plus } from "lucide-react";
import Badge from "../common/Badge";

export default function FlowerTable({
  flowers = [],
  onEdit,
  onDelete,
  onAddNew,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [colorFilter, setColorFilter] = useState("all");

  const filteredFlowers = flowers.filter((flower) => {
    const matchesSearch =
      flower.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flower.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flower.color?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor =
      colorFilter === "all" ||
      flower.color?.toLowerCase() === colorFilter.toLowerCase();
    return matchesSearch && matchesColor;
  });

  const uniqueColors = [
    ...new Set(flowers.map((f) => f.color).filter(Boolean)),
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search flowers or species..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Colors</option>
            {uniqueColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

        {onAddNew && (
          <button
            onClick={onAddNew}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Flower</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Flower Name & Species</th>
              <th className="py-3.5 px-4">Color</th>
              <th className="py-3.5 px-4">Price / Stem</th>
              <th className="py-3.5 px-4">Stock Level</th>
              <th className="py-3.5 px-4">Freshness Date</th>
              <th className="py-3.5 px-4">Care Instructions</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredFlowers.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500">
                  No flowers found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredFlowers.map((flower) => {
                const isLowStock =
                  flower.stock_quantity <= (flower.low_stock_threshold || 20);
                return (
                  <tr
                    key={flower.id || flower.name}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      <div>{flower.name}</div>
                      <div className="text-xs text-gray-500 italic">
                        {flower.species || "General Variety"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="default">{flower.color || "Mixed"}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      ${Number(flower.price_per_stem || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-semibold ${
                            isLowStock ? "text-rose-600" : "text-gray-900"
                          }`}
                        >
                          {flower.stock_quantity} units
                        </span>
                        {isLowStock && (
                          <span
                            title="Low Stock Alert"
                            className="inline-flex items-center text-amber-600"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {flower.freshness_date || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                      {flower.care_instructions || "Keep in cool water"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(flower)}
                          className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Edit Flower"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(flower.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                          title="Delete Flower"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
