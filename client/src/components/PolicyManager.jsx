import React, { useState } from "react";
import { Shield, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { updatePolicy } from "../services/api";

export default function PolicyManager({ policies = [], onRefresh }) {
  const [editingPolicies, setEditingPolicies] = useState(policies);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);

  React.useEffect(() => {
    setEditingPolicies(policies);
  }, [policies]);

  const handleChange = (id, field, value) => {
    setEditingPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleSave = async (policy) => {
    setSavingId(policy.id);
    setMessage(null);
    try {
      await updatePolicy(policy.id, policy);
      setMessage(`Security Policy '${policy.name}' updated successfully.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setMessage(`Failed to update security policy '${policy.name}'.`);
    } finally {
      setSavingId(null);
    }
  };

  if (!editingPolicies || editingPolicies.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        No active security compliance policies found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {editingPolicies.map((policy) => (
          <div
            key={policy.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {policy.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {policy.description ||
                      "Global fleet security policy baseline"}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  policy.is_active
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {policy.is_active ? "Enforced" : "Inactive"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Minimum Apple iOS Version
                </label>
                <input
                  type="text"
                  value={policy.min_os_version_ios || ""}
                  onChange={(e) =>
                    handleChange(
                      policy.id,
                      "min_os_version_ios",
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Minimum Google Android Version
                </label>
                <input
                  type="text"
                  value={policy.min_os_version_android || ""}
                  onChange={(e) =>
                    handleChange(
                      policy.id,
                      "min_os_version_android",
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.require_encryption || false}
                    onChange={(e) =>
                      handleChange(
                        policy.id,
                        "require_encryption",
                        e.target.checked,
                      )
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Mandate Hardware Storage Encryption (AES-256)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.require_passcode || false}
                    onChange={(e) =>
                      handleChange(
                        policy.id,
                        "require_passcode",
                        e.target.checked,
                      )
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Mandate Device Passcode / Biometric Enforcement
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave(policy)}
                disabled={savingId === policy.id}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {savingId === policy.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Policy</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
