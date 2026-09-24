import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Globe, Clock, Timer } from "lucide-react";

export const RegisterApiModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    http_method: "GET",
    check_interval_seconds: 60,
    expected_status_code: 200,
    timeout_ms: 5000,
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        url: initialData.url || "",
        http_method: initialData.http_method || "GET",
        check_interval_seconds: initialData.check_interval_seconds ?? 60,
        expected_status_code: initialData.expected_status_code ?? 200,
        timeout_ms: initialData.timeout_ms ?? 5000,
        is_active: initialData.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        url: "",
        http_method: "GET",
        check_interval_seconds: 60,
        expected_status_code: 200,
        timeout_ms: 5000,
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Monitor name is required";
    }
    if (!formData.url.trim()) {
      newErrors.url = "Endpoint URL is required";
    } else {
      try {
        const parsed = new URL(formData.url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          newErrors.url = "URL must start with http:// or https://";
        }
      } catch {
        newErrors.url = "Please enter a valid HTTP/HTTPS URL";
      }
    }

    if (
      !formData.check_interval_seconds ||
      Number(formData.check_interval_seconds) < 5
    ) {
      newErrors.check_interval_seconds = "Interval must be at least 5 seconds";
    }

    if (
      !formData.expected_status_code ||
      Number(formData.expected_status_code) < 100 ||
      Number(formData.expected_status_code) > 599
    ) {
      newErrors.expected_status_code =
        "Status code must be between 100 and 599";
    }

    if (!formData.timeout_ms || Number(formData.timeout_ms) < 100) {
      newErrors.timeout_ms = "Timeout must be at least 100ms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : [
                "check_interval_seconds",
                "expected_status_code",
                "timeout_ms",
              ].includes(name)
            ? Number(value)
            : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save monitor configuration.",
      );
    }
  };

  const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  return (
    <div
      data-testid="register-api-modal"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-[#111827] border border-[#06b6d4]/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-[#f8fafc] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <Globe className="text-[#06b6d4] w-5 h-5" />
            <h2 className="text-lg font-semibold text-[#f8fafc]">
              {initialData
                ? "Edit Monitor Configuration"
                : "Register Target API for Monitoring"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#f8fafc] p-1.5 rounded-lg hover:bg-[#1e293b] transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Monitor Name */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Friendly Monitor Title *
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. User Authentication Service"
              value={formData.name}
              onChange={handleChange}
              className={`w-full bg-[#0b0f17] border ${
                errors.name ? "border-rose-500" : "border-[#334155]"
              } rounded-lg px-3.5 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] outline-none transition`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-400">{errors.name}</p>
            )}
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Target Endpoint URL *
            </label>
            <input
              type="url"
              name="url"
              placeholder="https://api.example.com/v1/health"
              value={formData.url}
              onChange={handleChange}
              className={`w-full bg-[#0b0f17] border ${
                errors.url ? "border-rose-500" : "border-[#334155]"
              } rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#f8fafc] placeholder-slate-600 focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] outline-none transition`}
            />
            {errors.url && (
              <p className="mt-1 text-xs text-rose-400">{errors.url}</p>
            )}
          </div>

          {/* HTTP Method & Expected Status Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                HTTP Method
              </label>
              <select
                name="http_method"
                value={formData.http_method}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg px-3 py-2.5 text-sm font-mono text-[#f8fafc] focus:border-[#06b6d4] outline-none"
              >
                {httpMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Expected Status Code
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="expected_status_code"
                  value={formData.expected_status_code}
                  onChange={handleChange}
                  className={`w-full bg-[#0b0f17] border ${
                    errors.expected_status_code
                      ? "border-rose-500"
                      : "border-[#334155]"
                  } rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#f8fafc] focus:border-[#06b6d4] outline-none`}
                />
              </div>
              {errors.expected_status_code && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.expected_status_code}
                </p>
              )}
            </div>
          </div>

          {/* Interval & Timeout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-[#06b6d4]" />
                Check Frequency (Seconds)
              </label>
              <input
                type="number"
                name="check_interval_seconds"
                min="5"
                step="1"
                value={formData.check_interval_seconds}
                onChange={handleChange}
                className={`w-full bg-[#0b0f17] border ${
                  errors.check_interval_seconds
                    ? "border-rose-500"
                    : "border-[#334155]"
                } rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#f8fafc] focus:border-[#06b6d4] outline-none`}
              />
              {errors.check_interval_seconds && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.check_interval_seconds}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
                <Timer size={14} className="text-[#06b6d4]" />
                Timeout Threshold (ms)
              </label>
              <input
                type="number"
                name="timeout_ms"
                min="100"
                step="100"
                value={formData.timeout_ms}
                onChange={handleChange}
                className={`w-full bg-[#0b0f17] border ${
                  errors.timeout_ms ? "border-rose-500" : "border-[#334155]"
                } rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#f8fafc] focus:border-[#06b6d4] outline-none`}
              />
              {errors.timeout_ms && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.timeout_ms}
                </p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="pt-2 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]"></div>
            </label>
            <span className="text-sm font-medium text-[#f8fafc]">
              Enable automatic background health checks
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-[#94a3b8] hover:text-[#f8fafc] text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-[#06b6d4] hover:bg-[#22d3ee] text-[#0b0f17] text-sm font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#0b0f17] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              <span>{initialData ? "Update Monitor" : "Register API"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterApiModal;
