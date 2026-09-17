import React from "react";
import { Layers, CheckCircle, AlertCircle } from "lucide-react";

export const BatchTable = ({ batches }) => {
  const list = batches || [
    {
      id: "batch-2026-001",
      batch_number: "BATCH-2026-001",
      chip_name: "Gold 100",
      total_quantity: 100000,
      available_quantity: 80000,
      allocated_quantity: 20000,
      tray_location: "Vault Alpha - Tray 04",
      status: "Active",
      created_at: "2026-01-15T08:30:00Z",
    },
    {
      id: "batch-2026-002",
      batch_number: "BATCH-2026-002",
      chip_name: "Platinum 1000",
      total_quantity: 50000,
      available_quantity: 15000,
      allocated_quantity: 35000,
      tray_location: "Vault Beta - Tray 01",
      status: "Low Stock",
      created_at: "2026-02-01T10:15:00Z",
    },
  ];

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-6 shadow-xl">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Vault Batch Stock Inventory
            </h3>
            <p className="text-xs text-slate-400">
              Detailed batch allocations and status breakdown
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
              <th className="py-3 px-4">Batch Number</th>
              <th className="py-3 px-4">Chip Type</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Available / Total</th>
              <th className="py-3 px-4">Allocated</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-mono text-slate-200">
            {list.map((batch) => (
              <tr
                key={batch.id}
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3.5 px-4 font-bold text-cyan-400">
                  {batch.batch_number}
                </td>
                <td className="py-3.5 px-4 font-sans font-semibold text-white">
                  {batch.chip_name || "Gold 100"}
                </td>
                <td className="py-3.5 px-4 text-xs font-sans text-slate-400">
                  {batch.tray_location || "Vault Main"}
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-emerald-400 font-bold">
                    {batch.available_quantity.toLocaleString()}
                  </span>
                  <span className="text-slate-500">
                    {" "}
                    / {batch.total_quantity.toLocaleString()}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  {batch.allocated_quantity.toLocaleString()}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold ${
                      batch.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {batch.status === "Active" ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {batch.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchTable;
