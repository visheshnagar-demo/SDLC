import React, { useState, useEffect } from "react";
import {
  Sliders,
  HardDrive,
  Cpu,
  Save,
  AlertCircle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function QuotaConfigCard({ tenantId, config, onSave }) {
  const [rateLimitRpm, setRateLimitRpm] = useState(1000);
  const [storageQuotaGb, setStorageQuotaGb] = useState(50);
  const [featureFlags, setFeatureFlags] = useState({
    audit_logging: true,
    custom_domain: true,
    sso_integration: false,
    advanced_analytics: false,
  });

  const [saving, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (config) {
      if (config.rate_limit_rpm !== undefined)
        setRateLimitRpm(config.rate_limit_rpm);
      if (config.storage_quota_gb !== undefined)
        setStorageQuotaGb(config.storage_quota_gb);
      if (config.feature_flags) setFeatureFlags(config.feature_flags);
    }
  }, [config]);

  const handleToggleFeature = (key) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg("");
    setLoading(true);

    try {
      await onSave({
        rate_limit_rpm: parseInt(rateLimitRpm, 10),
        storage_quota_gb: parseInt(storageQuotaGb, 10),
        feature_flags: featureFlags,
      });
      setSuccessMsg("Tenant configuration updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update tenant quotas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-800">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Tenant Quota & Feature Flags
          </h2>
          <p className="text-xs text-slate-400">
            Configure rate limits, storage allocations, and module toggles
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Rate Limit Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label className="font-medium text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              API Rate Limit (RPM)
            </label>
            <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {rateLimitRpm} req/min
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={rateLimitRpm}
            onChange={(e) => setRateLimitRpm(e.target.value)}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>100 RPM</span>
            <span>5,000 RPM</span>
            <span>10,000 RPM</span>
          </div>
        </div>

        {/* Storage Quota Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label className="font-medium text-slate-200 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Storage Quota (GB)
            </label>
            <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {storageQuotaGb} GB
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="1000"
            value={storageQuotaGb}
            onChange={(e) => setStorageQuotaGb(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Dynamic Feature Flags */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Feature Flags & Entitlements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(featureFlags).map((flagKey) => {
              const enabled = featureFlags[flagKey];
              const label = flagKey.replace(/_/g, " ").toUpperCase();
              return (
                <div
                  key={flagKey}
                  onClick={() => handleToggleFeature(flagKey)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                    enabled
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200"
                      : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xs font-medium">{label}</span>
                  {enabled ? (
                    <ToggleRight className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving Config...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Quotas & Config
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
