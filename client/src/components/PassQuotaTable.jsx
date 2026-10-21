import React, { useState } from "react";
import { Edit3, Check, X, Shield, DollarSign, Layers } from "lucide-react";

export const PassQuotaTable = ({ tiers = [], onUpdateTier, isUpdating }) => {
  const [editingTierId, setEditingTierId] = useState(null);
  const [editForm, setEditForm] = useState({
    price: "",
    total_quota: "",
    available_quota: "",
    tier_name: "",
    description: "",
  });

  const startEdit = (tier) => {
    setEditingTierId(tier.id);
    setEditForm({
      price: tier.price,
      total_quota: tier.total_quota,
      available_quota: tier.available_quota,
      tier_name: tier.tier_name,
      description: tier.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingTierId(null);
  };

  const handleSave = async (tierId) => {
    await onUpdateTier(tierId, {
      price: parseFloat(editForm.price),
      total_quota: parseInt(editForm.total_quota, 10),
      available_quota: parseInt(editForm.available_quota, 10),
      tier_name: editForm.tier_name,
      description: editForm.description,
    });
    setEditingTierId(null);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F59E0B]" />
            <span>Pass Quotas & Dynamic Pricing</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust ticket allocations, capacity limits, and pricing in real
            time.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Pass Tier</th>
              <th className="py-3 px-3">Price</th>
              <th className="py-3 px-3">Total Quota</th>
              <th className="py-3 px-3">Available</th>
              <th className="py-3 px-3">Sold %</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tiers.map((tier) => {
              const isEditing = editingTierId === tier.id;
              const soldCount = tier.total_quota - tier.available_quota;
              const percentSold = Math.min(
                100,
                Math.round((soldCount / (tier.total_quota || 1)) * 100),
              );

              return (
                <tr
                  key={tier.id}
                  className="hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.tier_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            tier_name: e.target.value,
                          })
                        }
                        className="bg-[#0B0F19] border border-slate-700 rounded px-2 py-1 text-white text-xs w-full"
                      />
                    ) : (
                      <div>
                        <span className="font-bold text-slate-200 block text-sm">
                          {tier.tier_name}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                          {tier.description || "General event tier"}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                        className="bg-[#0B0F19] border border-slate-700 rounded px-2 py-1 text-white text-xs w-20"
                      />
                    ) : (
                      <span className="font-bold text-[#F59E0B] font-display text-sm">
                        ${Number(tier.price).toFixed(2)}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.total_quota}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            total_quota: e.target.value,
                          })
                        }
                        className="bg-[#0B0F19] border border-slate-700 rounded px-2 py-1 text-white text-xs w-20"
                      />
                    ) : (
                      <span className="font-semibold text-slate-300">
                        {tier.total_quota.toLocaleString()}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.available_quota}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            available_quota: e.target.value,
                          })
                        }
                        className="bg-[#0B0F19] border border-slate-700 rounded px-2 py-1 text-white text-xs w-20"
                      />
                    ) : (
                      <span
                        className={`font-semibold ${
                          tier.available_quota > 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {tier.available_quota.toLocaleString()}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-[#F59E0B] rounded-full"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-[11px] font-medium">
                        {percentSold}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleSave(tier.id)}
                          className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(tier)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 ml-auto"
                      >
                        <Edit3 className="w-3 h-3 text-[#F59E0B]" />
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
};

export default PassQuotaTable;
