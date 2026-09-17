import React from "react";
import { X, ShieldCheck, Hash, Terminal } from "lucide-react";

export const AuditInspectorDrawer = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Compliance Audit Inspector
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Log ID: {log.id}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-200">
                  {new Date(log.timestamp).toUTCString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actor:</span>
                <span className="text-cyan-400 font-bold">
                  {log.actor_name || log.actor_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action Type:</span>
                <span className="text-purple-400 font-bold">
                  {log.action_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IP Address:</span>
                <span className="text-slate-300">
                  {log.ip_address || "127.0.0.1"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Hash className="w-4 h-4 text-cyan-400" />
                Cryptographic Block Hash
              </label>
              <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-lg font-mono text-xs text-cyan-300 break-all select-all">
                {log.sha256_hash ||
                  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  Before State
                </label>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-300/90 overflow-x-auto">
                  {JSON.stringify(log.before_state || {}, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  After State
                </label>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300/90 overflow-x-auto">
                  {JSON.stringify(log.after_state || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Close Inspector Drawer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditInspectorDrawer;
