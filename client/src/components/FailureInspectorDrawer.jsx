import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Copy,
  Check,
  Clock,
  Globe,
  Terminal,
  FileCode,
  ShieldAlert,
} from "lucide-react";

export default function FailureInspectorDrawer({
  isOpen,
  onClose,
  logEntry = null,
}) {
  const [copiedSection, setCopiedSection] = useState(null);

  if (!isOpen || !logEntry) return null;

  const handleCopy = (text, section) => {
    navigator.clipboard.writeText(
      typeof text === "string" ? text : JSON.stringify(text, null, 2),
    );
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formattedDate = logEntry.checked_at
    ? new Date(logEntry.checked_at).toLocaleString()
    : "Unknown";

  const responseBodyText =
    typeof logEntry.response_body === "string"
      ? logEntry.response_body
      : logEntry.response_body
        ? JSON.stringify(logEntry.response_body, null, 2)
        : "No response body captured";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-xl bg-[#0f131c] border-l border-slate-800 h-full flex flex-col shadow-2xl relative overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-[#111622] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <span>Failure Diagnostic Inspector</span>
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Probe ID: {logEntry.id || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300 font-sans">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-[#0b0f17] border border-slate-800 rounded-lg">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                HTTP Status
              </span>
              <span className="text-base font-bold font-mono text-rose-400">
                {logEntry.response_status || "ERR"}
              </span>
            </div>
            <div className="p-3 bg-[#0b0f17] border border-slate-800 rounded-lg">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Latency
              </span>
              <span className="text-base font-bold font-mono text-amber-400">
                {logEntry.latency_ms !== null &&
                logEntry.latency_ms !== undefined
                  ? `${logEntry.latency_ms.toFixed(1)} ms`
                  : "N/A"}
              </span>
            </div>
            <div className="p-3 bg-[#0b0f17] border border-slate-800 rounded-lg">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Operational
              </span>
              <span className="text-base font-bold font-mono text-rose-400">
                {logEntry.operational_status || "Down"}
              </span>
            </div>
          </div>

          {/* Endpoint Information */}
          <div className="p-3.5 bg-[#0b0f17] border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-slate-200">
                  Endpoint Target
                </span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {formattedDate}
              </span>
            </div>
            <p className="font-mono text-xs text-cyan-300 break-all bg-[#0f131c] p-2 rounded border border-slate-800">
              {logEntry.target_url || logEntry.api_name || "Target API"}
            </p>
          </div>

          {/* Error Message Details */}
          {logEntry.error_message && (
            <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-lg space-y-1.5">
              <div className="flex items-center space-x-1.5 text-rose-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Error Description</span>
              </div>
              <p className="font-mono text-xs text-rose-300 break-words">
                {logEntry.error_message}
              </p>
            </div>
          )}

          {/* Request Headers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-slate-300 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Request Headers</span>
              </span>
              <button
                onClick={() => handleCopy(logEntry.request_headers, "headers")}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {copiedSection === "headers" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedSection === "headers" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
              {logEntry.request_headers
                ? JSON.stringify(logEntry.request_headers, null, 2)
                : "// No custom headers configured"}
            </pre>
          </div>

          {/* Response Body Snippet (up to 2,048 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-slate-300 flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>Response Body Preview (truncated)</span>
              </span>
              <button
                onClick={() => handleCopy(responseBodyText, "body")}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {copiedSection === "body" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedSection === "body" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 whitespace-pre-wrap break-all">
              {responseBodyText.slice(0, 2048)}
            </pre>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111622] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
