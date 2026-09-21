import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { apiService } from "../services/api";

export default function ApiRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  apiToEdit = null,
}) {
  const isEditing = !!apiToEdit;

  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [httpMethod, setHttpMethod] = useState("GET");
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [timeoutSeconds, setTimeoutSeconds] = useState(5.0);
  const [headersList, setHeadersList] = useState([{ key: "", value: "" }]);
  const [requestBody, setRequestBody] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (apiToEdit) {
      setName(apiToEdit.name || "");
      setTargetUrl(apiToEdit.target_url || "");
      setHttpMethod(apiToEdit.http_method || "GET");
      setIntervalSeconds(apiToEdit.interval_seconds || 60);
      setExpectedStatus(apiToEdit.expected_status || 200);
      setTimeoutSeconds(apiToEdit.timeout_seconds || 5.0);
      setIsActive(apiToEdit.is_active !== false);
      setRequestBody(apiToEdit.request_body || "");

      // Parse headers
      if (
        apiToEdit.request_headers &&
        typeof apiToEdit.request_headers === "object"
      ) {
        const entries = Object.entries(apiToEdit.request_headers).map(
          ([k, v]) => ({
            key: k,
            value: String(v),
          }),
        );
        setHeadersList(entries.length > 0 ? entries : [{ key: "", value: "" }]);
      } else {
        setHeadersList([{ key: "", value: "" }]);
      }
    } else {
      // Defaults for new API
      setName("");
      setTargetUrl("");
      setHttpMethod("GET");
      setIntervalSeconds(60);
      setExpectedStatus(200);
      setTimeoutSeconds(5.0);
      setHeadersList([{ key: "User-Agent", value: "API-Health-Monitor/1.0" }]);
      setRequestBody("");
      setIsActive(true);
    }
    setError(null);
  }, [apiToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddHeader = () => {
    setHeadersList([...headersList, { key: "", value: "" }]);
  };

  const handleHeaderChange = (index, field, value) => {
    const updated = [...headersList];
    updated[index][field] = value;
    setHeadersList(updated);
  };

  const handleRemoveHeader = (index) => {
    const updated = headersList.filter((_, i) => i !== index);
    setHeadersList(updated.length > 0 ? updated : [{ key: "", value: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("API Name is required");
      return;
    }
    if (!targetUrl.trim()) {
      setError("Target URL is required");
      return;
    }
    try {
      new URL(targetUrl);
    } catch {
      setError("Target URL must be a valid HTTP or HTTPS URL");
      return;
    }

    // Headers object formatting
    const formattedHeaders = {};
    headersList.forEach(({ key, value }) => {
      if (key.trim()) {
        formattedHeaders[key.trim()] = value.trim();
      }
    });

    const payload = {
      name: name.trim(),
      target_url: targetUrl.trim(),
      http_method: httpMethod,
      interval_seconds: Number(intervalSeconds),
      expected_status: Number(expectedStatus),
      timeout_seconds: Number(timeoutSeconds),
      request_headers: formattedHeaders,
      request_body: httpMethod === "POST" ? requestBody.trim() : null,
      is_active: isActive,
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiService.updateApi(apiToEdit.id, payload);
      } else {
        await apiService.createApi(payload);
      }
      onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save API endpoint configuration";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>
                {isEditing
                  ? "Edit Monitored API Endpoint"
                  : "Register New API Endpoint"}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure target URL, health probe parameters, expected HTTP
              status, and headers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name and Target URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                API Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Auth Service Health"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Target URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                placeholder="https://api.internal/v1/auth/health"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                required
              />
            </div>
          </div>

          {/* Row 2: HTTP Method, Interval, Expected Status, Timeout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                HTTP Method
              </label>
              <select
                aria-label="HTTP Method"
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Probe Interval
              </label>
              <select
                aria-label="Probe Interval"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Expected Status
              </label>
              <input
                type="number"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                min="100"
                max="599"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Timeout (sec)
              </label>
              <input
                type="number"
                step="0.5"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                min="0.5"
                max="60"
              />
            </div>
          </div>

          {/* Request Body (only for POST) */}
          {httpMethod === "POST" && (
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Request Body (Payload JSON/String)
              </label>
              <textarea
                rows={3}
                placeholder='{"ping": "pong"}'
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {/* Request Headers Builder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300">
                Request Headers
              </label>
              <button
                type="button"
                onClick={handleAddHeader}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Header</span>
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto p-1">
              {headersList.map((header, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Header Key (e.g. Authorization)"
                    value={header.key}
                    onChange={(e) =>
                      handleHeaderChange(idx, "key", e.target.value)
                    }
                    className="w-1/2 bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Bearer token)"
                    value={header.value}
                    onChange={(e) =>
                      handleHeaderChange(idx, "value", e.target.value)
                    }
                    className="w-1/2 bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Monitoring Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f17] border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Enable Active Polling
              </span>
              <span className="text-[11px] text-slate-400">
                Automatically probe this endpoint according to the configured
                interval.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Endpoint"
                    : "Register Endpoint"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
