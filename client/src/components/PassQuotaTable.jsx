import React, { useState } from "react";
import {
  Edit2,
  Check,
  X,
  ShieldAlert,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

export function PassQuotaTable({ tiers, onUpdateTier, isUpdating }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    total_quota: 0,
    available_quota: 0,
    price: 0,
  });

  const startEdit = (tier) => {
    setEditingId(tier.id);
    setEditForm({
      total_quota: tier.total_quota,
      available_quota: tier.available_quota,
      price: tier.price,
    });
  };

  const handleSave = async (tierId) => {
    await onUpdateTier(tierId, editForm);
    setEditingId(null);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-slate-950 font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className='text-lg font-bold text-white font-["Syne"]'>
              Pass Tier Quota & Dynamic Pricing Controls
            </h2>
            <p className="text-xs text-slate-400">
              Adjust capacity limits and ticket pricing in real time to prevent
              venue overbooking.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3.5 px-4 rounded-l-xl">Pass Tier</th>
              <th className="py-3.5 px-4">Unit Price ($)</th>
              <th className="py-3.5 px-4">Total Quota</th>
              <th className="py-3.5 px-4">Available Quota</th>
              <th className="py-3.5 px-4">Sold Out Status</th>
              <th className="py-3.5 px-4 rounded-r-xl text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {tiers.map((tier) => {
              const isEditing = editingId === tier.id;
              const soldCount = Math.max(
                0,
                tier.total_quota - tier.available_quota,
              );
              const isSoldOut = tier.available_quota <= 0;

              return (
                <tr
                  key={tier.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className='py-4 px-4 font-bold text-white font-["Syne"] text-sm'>
                    {tier.tier_name}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 bg-[#0b0f19] border border-amber-400 rounded-lg px-2 py-1 text-white text-xs"
                      />
                    ) : (
                      <span className="font-bold text-amber-300">
                        ${Number(tier.price).toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Total Quota */}
                  <td className="py-4 px-4 font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.total_quota}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            total_quota: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-24 bg-[#0b0f19] border border-amber-400 rounded-lg px-2 py-1 text-white text-xs"
                      />
                    ) : (
                      <span>{tier.total_quota}</span>
                    )}
                  </td>

                  {/* Available Quota */}
                  <td className="py-4 px-4 font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.available_quota}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            available_quota: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-24 bg-[#0b0f19] border border-amber-400 rounded-lg px-2 py-1 text-white text-xs"
                      />
                    ) : (
                      <span
                        className={
                          tier.available_quota < 50
                            ? "text-amber-400 font-bold"
                            : "text-emerald-400"
                        }
                      >
                        {tier.available_quota} ({soldCount} sold)
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    {isSoldOut ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        SOLD OUT
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    )}
                  </td>

                  {/* Controls */}
                  <td className="py-4 px-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSave(tier.id)}
                          disabled={isUpdating}
                          className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-lg transition-colors"
                          title="Save Changes"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(tier)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PassQuotaTable;
