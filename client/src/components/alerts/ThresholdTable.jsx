import React from "react";
import { Sliders, Edit, CheckCircle, XCircle, Plus } from "lucide-react";

export default function ThresholdTable({
  thresholds = [],
  onEditThreshold,
  onAddNewThreshold,
}) {
  return (
    <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#00e5ff]" />
          <h2 className="text-base font-bold font-mono text-[#00e5ff]">
            Configured Parameter Boundary Limits
          </h2>
        </div>
        <button
          type="button"
          onClick={onAddNewThreshold}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c141f] hover:bg-[#1e2e45] text-[#00e5ff] text-xs font-mono font-semibold border border-[#00e5ff]/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Threshold</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1e2e45] text-[#8899a6] uppercase tracking-wider">
              <th className="py-3 px-4">Parameter</th>
              <th className="py-3 px-4">Min Limit</th>
              <th className="py-3 px-4">Max Limit</th>
              <th className="py-3 px-4">Active Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2e45]/50 text-[#dbe3f3]">
            {thresholds.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#bac9cc]">
                  No safety thresholds configured. Click "Add Threshold" to
                  establish boundary limits.
                </td>
              </tr>
            ) : (
              thresholds.map((threshold) => (
                <tr
                  key={threshold.id || threshold.parameter_name}
                  className="hover:bg-[#1e2e45]/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-[#c3f5ff]">
                    {threshold.parameter_name}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {threshold.min_threshold !== null &&
                    threshold.min_threshold !== undefined
                      ? threshold.min_threshold
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {threshold.max_threshold !== null &&
                    threshold.max_threshold !== undefined
                      ? threshold.max_threshold
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    {threshold.is_active !== false ? (
                      <span className="inline-flex items-center gap-1 text-[#34d399]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#8899a6]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Disabled</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onEditThreshold(threshold)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0c141f] hover:bg-[#1e2e45] text-[#00e5ff] border border-[#1e2e45] hover:border-[#00e5ff]/40 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
