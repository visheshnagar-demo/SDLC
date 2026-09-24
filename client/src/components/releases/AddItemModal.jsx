import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { AlertCircle } from "lucide-react";

const ISSUE_TYPES = ["Feature", "Bug", "Improvement", "Task"];
const PRIORITIES = ["Blocker", "Critical", "High", "Medium", "Low"];
const RESOLUTION_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export const AddItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    issue_key: "",
    summary: "",
    issue_type: "Feature",
    priority: "Medium",
    resolution_status: "Open",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        issue_key: initialData.issue_key || "",
        summary: initialData.summary || "",
        issue_type: initialData.issue_type || "Feature",
        priority: initialData.priority || "Medium",
        resolution_status: initialData.resolution_status || "Open",
      });
    } else {
      setFormData({
        issue_key: "",
        summary: "",
        issue_type: "Feature",
        priority: "Medium",
        resolution_status: "Open",
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.issue_key.trim()) {
      setError("Issue Key is required (e.g., SCRUM-123, FEAT-401).");
      return;
    }
    if (!formData.summary.trim()) {
      setError("Item Summary is required.");
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save item. Please try again.",
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData ? "Edit Associated Item" : "Link Feature / Bug to Release"
      }
      subtitle="Associate development deliverables, tracking priority and resolution status."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Issue Key & Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Issue Key <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="issue_key"
              value={formData.issue_key}
              onChange={handleChange}
              placeholder="e.g. SCRUM-204"
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm font-mono text-[#dae2fd] placeholder-slate-600 transition-colors uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Item Type
            </label>
            <select
              name="issue_type"
              value={formData.issue_type}
              onChange={handleChange}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] transition-colors"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Summary / Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="e.g. Realtime WebSocket notification gateway sync"
            className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] placeholder-slate-600 transition-colors"
            required
          />
        </div>

        {/* Priority & Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] transition-colors"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Resolution Status
            </label>
            <select
              name="resolution_status"
              value={formData.resolution_status}
              onChange={handleChange}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] transition-colors"
            >
              {RESOLUTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : initialData
                ? "Update Item"
                : "Link Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddItemModal;
