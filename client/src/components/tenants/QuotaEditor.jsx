import React, { useState } from "react";
import { Sliders, Save, CheckCircle, AlertTriangle } from "lucide-react";
import { tenantApi } from "../../services/api";

export default function QuotaEditor({
  tenantId,
  currentSubscription,
  onSubscriptionUpdated,
}) {
  const [tierName, setTierName] = useState(
    currentSubscription?.tier_name || "Starter",
  );
  const [maxUsers, setMaxUsers] = useState(
    currentSubscription?.custom_max_users ??
      currentSubscription?.max_users ??
      10,
  );
  const [maxStorageGb, setMaxStorageGb] = useState(
    currentSubscription?.custom_max_storage_gb ??
      currentSubscription?.max_storage_gb ??
      5,
  );
  const [saving, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        tier_name: tierName,
        custom_max_users: parseInt(maxUsers, 10),
        custom_max_storage_gb: parseInt(maxStorageGb, 10),
      };

      const updated = await tenantApi.updateSubscription(tenantId, payload);
      setStatusMessage({
        type: "success",
        text: "Resource quotas & subscription tier updated successfully.",
      });
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(updated);
      }
    } catch (err) {
      console.error("Failed to update subscription quotas:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to update quotas. Please check usage constraints.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 text-indigo-600 mb-4 pb-3 border-b border-slate-100">
        <Sliders className="w-5 h-5" />
        <h3 className="font-bold text-slate-900 text-sm">
          Quota & Subscription Overrides
        </h3>
      </div>

      {statusMessage && (
        <div
          className={`p-3 text-xs rounded-lg mb-4 flex items-center space-x-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 text-xs">
        {/* Tier Selector */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Subscription Tier
          </label>
          <select
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Starter">Starter Tier</option>
            <option value="Pro">Pro Tier</option>
            <option value="Enterprise">Enterprise Tier</option>
          </select>
        </div>

        {/* Max Users Slider & Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-semibold text-slate-700">
              Max User Seats
            </label>
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {maxUsers} users
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="1000"
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Max Storage Slider & Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-semibold text-slate-700">
              Storage Quota (GB)
            </label>
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {maxStorageGb} GB
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="2000"
            value={maxStorageGb}
            onChange={(e) => setMaxStorageGb(e.target.value)}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Updating Quotas..." : "Apply Quota Updates"}</span>
        </button>
      </form>
    </div>
  );
}
