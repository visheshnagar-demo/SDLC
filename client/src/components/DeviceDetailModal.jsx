import React, { useState } from "react";
import {
  X,
  Smartphone,
  Shield,
  Lock,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function DeviceDetailModal({
  device,
  onClose,
  onTriggerAction,
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionLoadingMessage] = useState(null);

  if (!device) return null;

  const handleAction = async (actionType) => {
    if (!onTriggerAction) return;
    setActionLoading(true);
    setActionLoadingMessage(null);
    try {
      await onTriggerAction(device.id, {
        action_type: actionType,
        reason: `Admin initiated ${actionType}`,
      });
      setActionLoadingMessage(`Triggered remote ${actionType} successfully.`);
    } catch (err) {
      setActionLoadingMessage(`Failed to trigger ${actionType}.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {device.model}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {device.manufacturer} • {device.os_type} {device.os_version}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {actionMessage && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              {actionMessage}
            </div>
          )}

          {/* Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                Serial Number
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {device.serial_number}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                IMEI
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {device.imei}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                Ownership
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {device.ownership_type}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                Status
              </span>
              <div className="mt-1">
                <StatusBadge status={device.status} />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                Storage Encryption
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {device.is_encrypted ? "Encrypted (AES-256)" : "Disabled"}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                Passcode Enforced
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {device.passcode_enforced ? "Enforced" : "Not Enforced"}
              </span>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Security Compliance Baseline</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                Compliance Status:
              </span>
              {device.is_compliant ? (
                <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Compliant</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-rose-600 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Non-Compliant</span>
                </span>
              )}
            </div>
          </div>

          {/* Remote Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Remote Management Commands
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleAction("lock")}
                disabled={actionLoading}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 rounded-lg text-xs font-medium border border-amber-200 dark:border-amber-800 transition-colors disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Remote Lock</span>
              </button>

              <button
                onClick={() => handleAction("wipe")}
                disabled={actionLoading}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-800 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Remote Wipe</span>
              </button>

              <button
                onClick={() => handleAction("status_check")}
                disabled={actionLoading}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Status</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
