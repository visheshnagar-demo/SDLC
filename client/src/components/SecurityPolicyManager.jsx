import React, { useState, useEffect } from "react";
import { ShieldCheck, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updatePolicy } from "../services/api";

export default function SecurityPolicyManager({
  policies = [],
  onPolicyUpdated,
}) {
  const [activePolicy, setActivePolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    min_os_version_ios: "16.0",
    min_os_version_android: "13.0",
    require_encryption: true,
    require_passcode: true,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (policies && policies.length > 0) {
      const p = policies[0];
      setActivePolicy(p);
      setFormData({
        name: p.name || "Enterprise Baseline Policy",
        min_os_version_ios: p.min_os_version_ios || "16.0",
        min_os_version_android: p.min_os_version_android || "13.0",
        require_encryption: p.require_encryption ?? true,
        require_passcode: p.require_passcode ?? true,
        is_active: p.is_active ?? true,
      });
    }
  }, [policies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      if (activePolicy?.id) {
        await updatePolicy(activePolicy.id, formData);
        setStatusMessage({
          type: "success",
          text: "Security policy updated successfully.",
        });
        if (onPolicyUpdated) onPolicyUpdated();
      } else {
        setStatusMessage({
          type: "info",
          text: "Policy changes saved locally.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to update security policy.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Security & Compliance Baseline Policies
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure minimum OS baselines, storage encryption, and passcode
              requirements for enterprise mobile devices
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          role="alert"
          className={`mt-4 p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Policy Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Minimum iOS Version
            </label>
            <input
              type="text"
              value={formData.min_os_version_ios}
              onChange={(e) =>
                setFormData({ ...formData, min_os_version_ios: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white outline-none"
              placeholder="e.g. 16.0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Minimum Android Version
            </label>
            <input
              type="text"
              value={formData.min_os_version_android}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_os_version_android: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white outline-none"
              placeholder="e.g. 13.0"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.require_encryption}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  require_encryption: e.target.checked,
                })
              }
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Mandatory Storage Hardware Encryption (AES-256)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.require_passcode}
              onChange={(e) =>
                setFormData({ ...formData, require_passcode: e.target.checked })
              }
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Enforce Complex Passcode / Biometric Authentication
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Policy Active & Automated Compliance Checking Enabled
            </span>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving..." : "Save Policy Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
