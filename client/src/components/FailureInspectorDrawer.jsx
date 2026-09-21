import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  AlertOctagon,
  Terminal,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function FailureInspectorDrawer({
  isOpen,
  onClose,
  failureLog,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !failureLog) return null;

  const handleCopy = () => {
    const diagnosticText = JSON.stringify(failureLog, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(diagnosticText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "Unknown";
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111622] border-l border-slate-700/80 w-full max-w-xl h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Failure Inspector</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {failureLog.response_status
                    ? `HTTP ${failureLog.response_status}`
                    : "TIMEOUT / ERROR"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Log ID: {failureLog.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Copy Diagnostic JSON"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Summary Section */}
          <div className="bg-[#0b0f17] rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Endpoint</span>
              <span className="font-semibold text-slate-200">
                {failureLog.api_name || failureLog.api_id}
              </span>
            </div>

            {failureLog.target_url && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target URL</span>
                <span className="font-mono text-cyan-400 truncate max-w-xs">
                  {failureLog.target_url}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Probe Latency</span>
              <span className="font-mono text-rose-400 font-bold">
                {failureLog.latency_ms?.toFixed(1) || 0} ms
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Incident Timestamp</span>
              <span className="font-mono text-slate-300">
                {formatTimestamp(failureLog.checked_at)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Diagnostic Error Message</span>
            </label>
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 text-rose-300 font-mono text-xs break-all">
              {failureLog.error_message ||
                "Probe failed without explicit error detail."}
            </div>
          </div>

          {/* Request Headers */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Request Headers</span>
            </label>
            <div className="bg-[#0b0f17] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-36">
              {failureLog.request_headers &&
              Object.keys(failureLog.request_headers).length > 0 ? (
                <pre>{JSON.stringify(failureLog.request_headers, null, 2)}</pre>
              ) : (
                <span className="text-slate-500">
                  No custom request headers sent.
                </span>
              )}
            </div>
          </div>

          {/* Response Body Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Response Body Preview (Max 2,048 chars)
            </label>
            <div className="bg-[#0b0f17] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {failureLog.response_body ? (
                failureLog.response_body
              ) : (
                <span className="text-slate-500">
                  No response payload returned.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0f131c]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
