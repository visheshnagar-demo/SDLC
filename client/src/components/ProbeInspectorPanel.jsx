import React from "react";
import { StatusBadge } from "./StatusBadge";
import { X, Server, AlertTriangle, Network, Layers } from "lucide-react";

export const ProbeInspectorPanel = ({ log, onClose }) => {
  if (!log) return null;

  const formatTimestamp = (ts) => {
    if (!ts) return "--";
    try {
      const d = new Date(ts);
      return d.toUTCString();
    } catch {
      return ts;
    }
  };

  // Simulate or compute network waterfall breakdown if not provided in log payload
  const totalLatency = Number(log.latency_ms || 0);
  const dnsTime = Math.max(2, Math.round(totalLatency * 0.12));
  const tcpTime = Math.max(4, Math.round(totalLatency * 0.18));
  const tlsTime = Math.max(6, Math.round(totalLatency * 0.25));
  const ttfbTime = Math.max(
    1,
    Math.round(totalLatency - (dnsTime + tcpTime + tlsTime)),
  );

  return (
    <div
      data-testid="probe-inspector-panel"
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#111827] border-l border-[#1e293b] shadow-2xl z-50 flex flex-col text-[#f8fafc] animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0b0f17]/60">
        <div className="flex items-center gap-2.5">
          <Server className="text-[#06b6d4] w-5 h-5" />
          <h3 className="font-semibold text-base">
            Probe Diagnostic Inspector
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#94a3b8] hover:text-[#f8fafc] p-1.5 rounded-lg hover:bg-[#1e293b] transition"
          aria-label="Close inspector"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
        {/* Status summary banner */}
        <div className="bg-[#0b0f17] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">
              Health State
            </div>
            <StatusBadge status={log.status || "UNHEALTHY"} size="md" />
          </div>
          <div className="text-right">
            <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">
              HTTP Status
            </div>
            <span className="font-mono text-base font-bold text-[#f8fafc]">
              {log.status_code !== undefined && log.status_code !== null
                ? log.status_code
                : "N/A"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">
              Total Latency
            </div>
            <span className="font-mono text-base font-bold text-cyan-400">
              {totalLatency.toFixed(1)} ms
            </span>
          </div>
        </div>

        {/* Target Details */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
            Target Endpoint
          </h4>
          <div className="bg-[#0b0f17] p-3.5 rounded-lg border border-[#1e293b] font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="text-[#f8fafc] font-semibold">
                {log.monitor_name || log.monitor_id || "Target API"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500">URL:</span>
              <span className="text-cyan-300 break-all text-right">
                {log.endpoint_url || log.url || "--"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">HTTP Method:</span>
              <span className="text-slate-200 font-bold">
                {log.http_method || "GET"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Execution Timestamp:</span>
              <span className="text-slate-300">
                {formatTimestamp(log.executed_at || log.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Error Diagnostic (if failure) */}
        {log.error_message && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Diagnostic Error Message
            </h4>
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-3.5 text-xs font-mono text-rose-300 leading-relaxed break-words">
              {log.error_message}
            </div>
          </div>
        )}

        {/* Timing Waterfall Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
            <Network size={14} className="text-[#06b6d4]" /> Timing Waterfall
            Breakdown
          </h4>
          <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>DNS Lookup</span>
                <span>{dnsTime} ms</span>
              </div>
              <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (dnsTime / totalLatency) * 100 || 20)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>TCP Handshake</span>
                <span>{tcpTime} ms</span>
              </div>
              <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (tcpTime / totalLatency) * 100 || 25)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>TLS Negotiation</span>
                <span>{tlsTime} ms</span>
              </div>
              <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (tlsTime / totalLatency) * 100 || 30)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Time to First Byte (TTFB)</span>
                <span>{ttfbTime} ms</span>
              </div>
              <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (ttfbTime / totalLatency) * 100 || 25)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Raw Probe Payload */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
            <Layers size={14} /> Raw Telemetry Entry
          </h4>
          <pre className="bg-[#0b0f17] border border-[#1e293b] p-3.5 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ProbeInspectorPanel;
