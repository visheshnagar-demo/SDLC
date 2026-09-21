import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Globe, ShieldAlert, Check } from "lucide-react";

export default function ApiRegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    target_url: "",
    http_method: "GET",
    interval_seconds: 60,
    expected_status: 200,
    timeout_seconds: 5.0,
    is_active: true,
    request_body: "",
  });

  const [headersList, setHeadersList] = useState([{ key: "", value: "" }]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        target_url: initialData.target_url || "",
        http_method: initialData.http_method || "GET",
        interval_seconds: initialData.interval_seconds || 60,
        expected_status: initialData.expected_status || 200,
        timeout_seconds: initialData.timeout_seconds || 5.0,
        is_active:
          initialData.is_active !== undefined ? initialData.is_active : true,
        request_body: initialData.request_body || "",
      });

      if (
        initialData.request_headers &&
        typeof initialData.request_headers === "object"
      ) {
        const parsedHeaders = Object.entries(initialData.request_headers).map(
          ([k, v]) => ({
            key: k,
            value: typeof v === "object" ? JSON.stringify(v) : String(v),
          }),
        );
        setHeadersList(
          parsedHeaders.length > 0 ? parsedHeaders : [{ key: "", value: "" }],
        );
      } else {
        setHeadersList([{ key: "", value: "" }]);
      }
    } else {
      setFormData({
        name: "",
        target_url: "",
        http_method: "GET",
        interval_seconds: 60,
        expected_status: 200,
        timeout_seconds: 5.0,
        is_active: true,
        request_body: "",
      });
      setHeadersList([{ key: "", value: "" }]);
    }
    setErrorMsg("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleHeaderChange = (index, field, value) => {
    setHeadersList((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addHeaderRow = () => {
    setHeadersList((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeHeaderRow = (index) => {
    setHeadersList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("API name is required.");
      return;
    }

    const url = formData.target_url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setErrorMsg("Target URL must start with http:// or https://");
      return;
    }

    // Parse headers dictionary
    const parsedHeaders = {};
    headersList.forEach((h) => {
      if (h.key.trim()) {
        parsedHeaders[h.key.trim()] = h.value;
      }
    });

    const payload = {
      name: formData.name.trim(),
      target_url: url,
      http_method: formData.http_method,
      interval_seconds: Number(formData.interval_seconds),
      expected_status: Number(formData.expected_status),
      timeout_seconds: Number(formData.timeout_seconds),
      is_active: formData.is_active,
      request_headers:
        Object.keys(parsedHeaders).length > 0 ? parsedHeaders : null,
      request_body: formData.request_body.trim() ? formData.request_body : null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save API configuration.";
      setErrorMsg(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#111622] border border-slate-700/80 rounded-2xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {initialData
                  ? "Edit Monitored Endpoint"
                  : "Register New API Endpoint"}
              </h2>
              <p className="text-xs text-slate-400">
                Configure health probe cadence, status code validation, and
                headers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Endpoint Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Auth Service Health"
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                HTTP Method <span className="text-rose-400">*</span>
              </label>
              <select
                name="http_method"
                value={formData.http_method}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition font-mono"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Target URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="target_url"
              value={formData.target_url}
              onChange={handleChange}
              placeholder="https://api.example.com/health"
              className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Probe Interval
              </label>
              <select
                name="interval_seconds"
                value={formData.interval_seconds}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:border-cyan-400 outline-none"
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute (60s)</option>
                <option value={300}>5 minutes (300s)</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Expected HTTP Status
              </label>
              <input
                type="number"
                name="expected_status"
                value={formData.expected_status}
                onChange={handleChange}
                min={100}
                max={599}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Timeout (seconds)
              </label>
              <input
                type="number"
                step="0.5"
                name="timeout_seconds"
                value={formData.timeout_seconds}
                onChange={handleChange}
                min={0.5}
                max={60}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 outline-none font-mono"
              />
            </div>
          </div>

          {/* Request Headers Builder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Custom Request Headers (Optional)
              </label>
              <button
                type="button"
                onClick={addHeaderRow}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Header</span>
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {headersList.map((header, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Header Key (e.g., Authorization)"
                    value={header.key}
                    onChange={(e) =>
                      handleHeaderChange(idx, "key", e.target.value)
                    }
                    className="flex-1 bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., Bearer token...)"
                    value={header.value}
                    onChange={(e) =>
                      handleHeaderChange(idx, "value", e.target.value)
                    }
                    className="flex-1 bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none focus:border-cyan-400"
                  />
                  {headersList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHeaderRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optional POST body */}
          {formData.http_method === "POST" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Request Body (JSON / text)
              </label>
              <textarea
                name="request_body"
                rows={3}
                value={formData.request_body}
                onChange={handleChange}
                placeholder='{"ping": "pong"}'
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-400 outline-none"
              />
            </div>
          )}

          {/* Active status checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="is_active_toggle"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded bg-[#0b0f17] border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="is_active_toggle"
              className="text-xs text-slate-300 cursor-pointer"
            >
              Enable background polling immediately
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-md shadow-cyan-500/20 transition disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {initialData ? "Save Changes" : "Register Endpoint"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
