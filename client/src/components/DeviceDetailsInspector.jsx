import React, { useState } from "react";
import {
  Smartphone,
  Shield,
  Lock,
  Trash,
  RefreshCw,
  User,
  Calendar,
  History,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function DeviceDetailsInspector({
  device,
  assignments = [],
  onAssign,
  onUnassign,
  onTriggerAction,
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  if (!device) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        No device selected for inspection.
      </div>
    );
  }

  const handleActionClick = async (actionType) => {
    if (!onTriggerAction) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await onTriggerAction(device.id, actionType);
      setActionMessage({
        type: "success",
        text: `Remote ${actionType} command issued successfully.`,
      });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.detail || `Failed to trigger ${actionType}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div
          role="alert"
          className={`p-4 rounded-lg text-xs font-medium ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Main Device Spec Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {device.model}
                </h1>
                <StatusBadge status={device.status} />
                <StatusBadge status={device.is_compliant} type="compliance" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {device.manufacturer} • {device.ownership_type || "Corporate"}{" "}
                Asset
              </p>
            </div>
          </div>

          {/* Quick Remote Command Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleActionClick("Lock")}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Remote Lock</span>
            </button>
            <button
              onClick={() => handleActionClick("Wipe")}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Remote Wipe</span>
            </button>
            <button
              onClick={() => handleActionClick("Status Check")}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`}
              />
              <span>Check Status</span>
            </button>
          </div>
        </div>

        {/* Hardware & Compliance Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">
              Serial Number
            </p>
            <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {device.serial_number || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">
              IMEI Number
            </p>
            <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {device.imei || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">
              OS & Version
            </p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {device.os_type} {device.os_version}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">
              Storage Encryption
            </p>
            <p className="text-xs font-semibold mt-1 flex items-center gap-1 text-slate-800 dark:text-slate-200">
              {device.is_encrypted ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Enabled
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Disabled
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Timeline History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-200 dark:border-slate-700">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Assignment Timeline & Custody History
          </h3>
        </div>

        <div className="mt-6 space-y-4">
          {assignments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No historical assignment records found for this device.
            </p>
          ) : (
            assignments.map((assignment, index) => (
              <div
                key={assignment.id || index}
                className="relative pl-6 pb-4 border-l-2 border-slate-200 dark:border-slate-700 last:border-l-0 last:pb-0"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-800" />
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Employee ID / User:{" "}
                      {assignment.user_id ||
                        assignment.user_email ||
                        "Assigned User"}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {assignment.assigned_at
                        ? new Date(assignment.assigned_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  {assignment.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                      "{assignment.notes}"
                    </p>
                  )}
                  {assignment.returned_at && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Returned on:{" "}
                      {new Date(assignment.returned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
