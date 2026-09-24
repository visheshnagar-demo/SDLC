import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { AlertCircle } from "lucide-react";

const AVAILABLE_ENVIRONMENTS = ["Development", "QA", "Staging", "Production"];
const AVAILABLE_STATUSES = [
  "Draft",
  "In Progress",
  "Ready",
  "Deployed",
  "Cancelled",
];

export const CreateReleaseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    semver: "",
    target_date: "",
    target_environments: ["Development", "QA", "Staging"],
    status: "Draft",
    description: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      // Format target date for datetime-local / date input
      let dateVal = "";
      if (initialData.target_date) {
        try {
          const d = new Date(initialData.target_date);
          if (!isNaN(d.getTime())) {
            dateVal = d.toISOString().split("T")[0];
          }
        } catch {
          dateVal = "";
        }
      }

      setFormData({
        name: initialData.name || "",
        semver: initialData.semver || "",
        target_date: dateVal,
        target_environments: Array.isArray(initialData.target_environments)
          ? initialData.target_environments
          : ["Development", "QA", "Staging"],
        status: initialData.status || "Draft",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        name: "",
        semver: "",
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        target_environments: ["Development", "QA", "Staging"],
        status: "Draft",
        description: "",
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const toggleEnvironment = (env) => {
    setFormData((prev) => {
      const exists = prev.target_environments.includes(env);
      const updated = exists
        ? prev.target_environments.filter((e) => e !== env)
        : [...prev.target_environments, env];
      return { ...prev, target_environments: updated };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Release Name is required.");
      return;
    }
    if (!formData.semver.trim()) {
      setError("SemVer version (e.g. 1.2.0 or v1.2.0) is required.");
      return;
    }
    if (formData.target_environments.length === 0) {
      setError("Please select at least one target environment.");
      return;
    }

    try {
      await onSubmit({
        ...formData,
        target_date: formData.target_date
          ? new Date(formData.target_date).toISOString()
          : null,
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save release. Please try again.",
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Software Release" : "Create Software Release"}
      subtitle="Define release milestone, SemVer versioning, target environments, and schedule."
      maxWidth="max-w-2xl"
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

        {/* Release Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Release Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Core Banking API & Webhook Sync"
            className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] placeholder-slate-600 transition-colors"
            required
          />
        </div>

        {/* SemVer & Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              SemVer Version <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="semver"
              value={formData.semver}
              onChange={handleChange}
              placeholder="e.g. v1.2.0 or 1.2.0"
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm font-mono text-[#dae2fd] placeholder-slate-600 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] transition-colors"
            >
              {AVAILABLE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Launch Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Target Launch Date
          </label>
          <input
            type="date"
            name="target_date"
            value={formData.target_date}
            onChange={handleChange}
            className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] transition-colors"
          />
        </div>

        {/* Target Environments Multi-Select Chips */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Target Environments <span className="text-rose-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {AVAILABLE_ENVIRONMENTS.map((env) => {
              const isSelected = formData.target_environments.includes(env);
              return (
                <button
                  type="button"
                  key={env}
                  onClick={() => toggleEnvironment(env)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-sm"
                      : "bg-[#0b0f19] text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                  }`}
                >
                  {isSelected && <span className="mr-1.5">✓</span>}
                  {env}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Release Notes / Description
          </label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Summary of scope, architectural changes, dependencies, or rollout steps..."
            className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] placeholder-slate-600 transition-colors"
          />
        </div>

        {/* Form Actions */}
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
                ? "Update Release"
                : "Create Release"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateReleaseModal;
