import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";

export default function DeleteChannelSafetyModal({
  channel,
  onClose,
  onConfirm,
}) {
  const [confirmCode, setConfirmCode] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!channel) return null;

  const isLive = channel.is_live || channel.status === "ACTIVE";
  const requiredConfirmation = channel.code || channel.name;

  const handleAction = async () => {
    if (
      isLive &&
      confirmCode.trim().toUpperCase() !== requiredConfirmation.toUpperCase()
    ) {
      setErrorMsg(
        `Please enter "${requiredConfirmation}" to confirm safety override.`,
      );
      return;
    }
    setErrorMsg("");
    setIsArchiving(true);
    try {
      await onConfirm(channel.id);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to process request.");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-800/80 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-red-950/50 border-b border-red-900/60 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-base text-slate-100">
              Safety Interlock: Delete Active Channel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3 bg-red-950/30 border border-red-800/40 p-3 rounded-lg text-xs text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">CRITICAL WARNING:</span> Channel{" "}
              <span className="font-mono font-bold underline text-white">
                {channel.name} ({channel.code})
              </span>{" "}
              is currently marked as{" "}
              <span className="font-bold text-red-400">ACTIVE / ON-AIR</span>.
              Direct deletion will interrupt live transmission for connected
              viewers.
            </div>
          </div>

          <p className="text-xs text-slate-300">
            To prevent accidental broadcast blackouts, live channels require
            safety override confirmation. This action will move the channel to{" "}
            <span className="font-semibold text-amber-400">ARCHIVED</span>{" "}
            status and terminate active multicast routes.
          </p>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Type{" "}
              <span className="text-white font-bold">
                {requiredConfirmation}
              </span>{" "}
              to confirm:
            </label>
            <input
              type="text"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder={requiredConfirmation}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="text-xs text-red-400 font-medium bg-red-950/40 p-2 rounded border border-red-800"
            >
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            disabled={isArchiving || (isLive && !confirmCode)}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-red-600/30 transition-all flex items-center gap-1"
          >
            {isArchiving ? "Archiving..." : "Archive Channel"}
          </button>
        </div>
      </div>
    </div>
  );
}
