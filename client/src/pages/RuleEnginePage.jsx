import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, Sliders, X, Check, AlertCircle } from "lucide-react";
import { getRules, updateRule, toggleRule, createRule } from "../services/api";
import RuleConfigCard from "../components/rules/RuleConfigCard";

export default function RuleEnginePage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    rule_type: "AMOUNT_THRESHOLD",
    description: "",
    severity: "HIGH",
    is_active: true,
    parameters: { threshold_amount: 10000 },
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRules();
      setRules(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load detection rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleUpdateRule = async (id, data) => {
    await updateRule(id, data);
    fetchRules();
  };

  const handleToggleRule = async (id, isActive) => {
    await toggleRule(id, isActive);
    fetchRules();
  };

  const handleRuleTypeChange = (type) => {
    let params = {};
    if (type === "AMOUNT_THRESHOLD") {
      params = { threshold_amount: 10000 };
    } else if (type === "FREQUENCY_VELOCITY") {
      params = { window_seconds: 600, max_count: 5 };
    } else if (type === "GEOGRAPHIC_VELOCITY") {
      params = { max_window_seconds: 3600, speed_threshold_mph: 500 };
    }
    setNewRule({ ...newRule, rule_type: type, parameters: params });
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await createRule(newRule);
      setIsModalOpen(false);
      setNewRule({
        name: "",
        rule_type: "AMOUNT_THRESHOLD",
        description: "",
        severity: "HIGH",
        is_active: true,
        parameters: { threshold_amount: 10000 },
      });
      fetchRules();
    } catch (err) {
      setCreateError(
        err.response?.data?.detail || err.message || "Failed to create rule",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dynamic Detection Rules &amp; Thresholds
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time configurable fraud detection rules with in-memory hot
            reload capabilities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create Detection Rule</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchRules}
            className="text-xs font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
          <p className="text-sm font-medium">Loading detection rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Sliders className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-700">
            No detection rules found
          </p>
          <p className="text-xs text-slate-400">
            Create your first dynamic fraud detection rule to start monitoring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <RuleConfigCard
              key={rule.id}
              rule={rule}
              onUpdateRule={handleUpdateRule}
              onToggleRule={handleToggleRule}
            />
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  Create Detection Rule
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., High Transaction Amount Threshold"
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule({ ...newRule, name: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rule Type
                </label>
                <select
                  value={newRule.rule_type}
                  onChange={(e) => handleRuleTypeChange(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="AMOUNT_THRESHOLD">AMOUNT_THRESHOLD</option>
                  <option value="FREQUENCY_VELOCITY">FREQUENCY_VELOCITY</option>
                  <option value="GEOGRAPHIC_VELOCITY">
                    GEOGRAPHIC_VELOCITY
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Brief explanation of the detection logic..."
                  value={newRule.description}
                  onChange={(e) =>
                    setNewRule({ ...newRule, description: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Severity
                </label>
                <select
                  value={newRule.severity}
                  onChange={(e) =>
                    setNewRule({ ...newRule, severity: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {creating ? "Creating..." : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
