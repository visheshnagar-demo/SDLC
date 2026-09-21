import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LowStockAlerts({ alerts = [], loading = false }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Low Stock Alerts</h3>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
            {alerts.length} Items
          </span>
        </div>
        <Link
          to="/adjustments"
          className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>Reorder & Adjust</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          Loading active stock alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          No low stock alerts detected. All items are above reorder threshold.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Item Name</th>
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3">Current Stock</th>
                <th className="px-5 py-3">Threshold</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {alerts.map((alert, idx) => (
                <tr
                  key={alert.item_id || idx}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs font-medium text-slate-900">
                    {alert.sku || "N/A"}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {alert.item_name || alert.name || "Unnamed Item"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {alert.warehouse_name || alert.warehouse || "Central"}
                  </td>
                  <td className="px-5 py-3 font-semibold text-amber-600">
                    {alert.current_stock ?? alert.quantity_on_hand ?? 0}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {alert.reorder_threshold ?? alert.threshold ?? 10}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      {alert.status || "LOW_STOCK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
