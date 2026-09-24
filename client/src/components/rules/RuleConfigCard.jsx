import React, { useState } from "react";
import {
  Check,
  AlertCircle,
  Sliders,
  DollarSign,
  Zap,
  Globe,
} from "lucide-react";

export default function RuleConfigCard({ rule, onUpdateRule, onToggleRule }) {
  const [isActive, setIsActive] = useState(rule.is_active ?? true);
  const [parameters, setParameters] = useState(rule.parameters || {});
  const [severity, setSeverity] = useState(rule.severity || "HIGH");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleToggle = async (e) => {
    const nextState = e.target.checked;
    setIsActive(nextState);
    try {
      if (onToggleRule) {
        await onToggleRule(rule.id, nextState);
      }
    } catch (err) {
      setIsActive(!nextState);
      setErrorMessage(err.message || "Failed to toggle rule");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleParamChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value === "" ? "" : Number(value),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");
    setErrorMessage("");
    try {
      await onUpdateRule(rule.id, {
        name: rule.name,
        rule_type: rule.rule_type,
        description: rule.description,
        parameters,
        severity,
        is_active: isActive,
      });
      setSavedMessage("Parameters updated successfully!");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail || err.message || "Failed to update rule",
      );
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const getRuleIcon = () => {
    switch (rule.rule_type) {
      case "AMOUNT_THRESHOLD":
        return <DollarSign className="w-5 h-5 text-blue-700" />;
      case "FREQUENCY_VELOCITY":
        return <Zap className="w-5 h-5 text-amber-600" />;
      case "GEOGRAPHIC_VELOCITY":
        return <Globe className="w-5 h-5 text-purple-600" />;
      default:
        return <Sliders className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              {getRuleIcon()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{rule.name}</h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {rule.rule_type}
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={handleToggle}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {rule.description}
        </p>

        {/* Dynamic Parameter Fields */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          {rule.rule_type === "AMOUNT_THRESHOLD" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Threshold Amount (USD)
              </label>
              <input
                type="number"
                min="1"
                value={parameters.threshold_amount ?? 10000}
                onChange={(e) =>
                  handleParamChange("threshold_amount", e.target.value)
                }
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          )}

          {rule.rule_type === "FREQUENCY_VELOCITY" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Time Window (sec)
                </label>
                <input
                  type="number"
                  min="10"
                  value={parameters.window_seconds ?? 600}
                  onChange={(e) =>
                    handleParamChange("window_seconds", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Count (txs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={parameters.max_count ?? 5}
                  onChange={(e) =>
                    handleParamChange("max_count", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          )}

          {rule.rule_type === "GEOGRAPHIC_VELOCITY" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Window (sec)
                </label>
                <input
                  type="number"
                  min="60"
                  value={parameters.max_window_seconds ?? 3600}
                  onChange={(e) =>
                    handleParamChange("max_window_seconds", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Speed Limit (mph)
                </label>
                <input
                  type="number"
                  min="50"
                  value={parameters.speed_threshold_mph ?? 500}
                  onChange={(e) =>
                    handleParamChange("speed_threshold_mph", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alert Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {errorMessage && (
          <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {savedMessage && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded flex items-center gap-1">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors border border-blue-200 shadow-sm disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Rule Changes"}
        </button>
      </div>
    </div>
  );
}
