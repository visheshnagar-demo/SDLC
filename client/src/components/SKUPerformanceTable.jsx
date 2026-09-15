import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Search, Filter, ArrowUpDown } from "lucide-react";

export default function SKUPerformanceTable({ skus, loading, error }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [sortField, setSortField] = useState("sales_per_linear_ft");
  const [sortOrder, setSortOrder] = useState("desc");

  const filteredAndSortedSkus = useMemo(() => {
    if (!skus || !Array.isArray(skus)) return [];

    return skus
      .filter((sku) => {
        const matchesSearch =
          sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sku.sku_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "ALL" || sku.status_badge === statusFilter;
        const matchesBrand =
          brandFilter === "ALL" ||
          (brandFilter === "PB" && sku.is_private_brand) ||
          (brandFilter === "NATIONAL" && !sku.is_private_brand);
        return matchesSearch && matchesStatus && matchesBrand;
      })
      .sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (typeof aVal === "string") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [skus, searchTerm, statusFilter, brandFilter, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getStatusBadgeClass = (badge) => {
    switch (badge) {
      case "GROW":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "MAINTAIN":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "SWAP":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "REDUCE":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Snacks SKU Performance Matrix
          </h2>
          <p className="text-xs text-slate-500">
            {filteredAndSortedSkus.length} of {skus?.length || 0} SKUs displayed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E5B800]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E5B800] bg-white text-slate-700"
              aria-label="Filter by Status"
            >
              <option value="ALL">All Actions</option>
              <option value="GROW">GROW</option>
              <option value="MAINTAIN">MAINTAIN</option>
              <option value="SWAP">SWAP</option>
              <option value="REDUCE">REDUCE</option>
            </select>
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E5B800] bg-white text-slate-700"
            aria-label="Filter by Brand"
          >
            <option value="ALL">All Brands</option>
            <option value="PB">Private Brand (PB)</option>
            <option value="NATIONAL">National Brand</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("sku_code")}
              >
                <div className="flex items-center gap-1">
                  SKU Code <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Product Name{" "}
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3">Brand Type</th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("weekly_unit_sales")}
              >
                <div className="flex items-center justify-end gap-1">
                  Weekly Sales{" "}
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("sales_per_linear_ft")}
              >
                <div className="flex items-center justify-end gap-1">
                  $/Linear Ft <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("margin_pct")}
              >
                <div className="flex items-center justify-end gap-1">
                  Margin % <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("space_allocation_ft")}
              >
                <div className="flex items-center justify-end gap-1">
                  Space (ft) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Status Badge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="py-8 text-center text-slate-400 font-medium"
                >
                  Loading Snacks SKU performance data...
                </td>
              </tr>
            ) : filteredAndSortedSkus.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="py-8 text-center text-slate-400 font-medium"
                >
                  No SKUs match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredAndSortedSkus.map((sku) => (
                <tr
                  key={sku.id || sku.sku_code}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-slate-900 font-medium">
                    {sku.sku_code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {sku.name}
                  </td>
                  <td className="py-2.5 px-3">
                    {sku.is_private_brand ? (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        Clover Valley (PB)
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium text-[10px]">
                        National Brand
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {sku.weekly_unit_sales} units
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    ${Number(sku.sales_per_linear_ft).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {Number(sku.margin_pct).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {Number(sku.space_allocation_ft).toFixed(1)} ft
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`border font-bold px-2.5 py-0.5 rounded-full text-[11px] ${getStatusBadgeClass(
                        sku.status_badge,
                      )}`}
                    >
                      {sku.status_badge}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

SKUPerformanceTable.propTypes = {
  skus: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      sku_code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      weekly_unit_sales: PropTypes.number.isRequired,
      sales_per_linear_ft: PropTypes.number.isRequired,
      margin_pct: PropTypes.number.isRequired,
      space_allocation_ft: PropTypes.number.isRequired,
      is_private_brand: PropTypes.bool.isRequired,
      status_badge: PropTypes.string.isRequired,
    }),
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
};
