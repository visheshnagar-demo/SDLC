import React from "react";
import { Building2, Layers } from "lucide-react";

export default function WarehouseDistribution({
  warehouses = [],
  loading = false,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">
            Warehouse Stock Breakdown
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {warehouses.length} Locations
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-slate-400 text-sm">
          Loading warehouse distribution...
        </div>
      ) : warehouses.length === 0 ? (
        <div className="p-6 text-center text-slate-500 text-sm">
          No warehouse data available.
        </div>
      ) : (
        <div className="space-y-4">
          {warehouses.map((wh, idx) => {
            const stockCount =
              wh.total_stock ?? wh.stock_count ?? wh.count ?? 0;
            return (
              <div
                key={wh.id || idx}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {wh.name ||
                      wh.warehouse_name ||
                      `Warehouse ${wh.code || idx + 1}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Code: <span className="font-mono">{wh.code || "MAIN"}</span>{" "}
                    | Location: {wh.location || "Primary Hub"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm font-bold text-blue-700">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{stockCount.toLocaleString()}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Total Units
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
