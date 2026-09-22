import React, { useState } from "react";
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  Terminal,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function InstanceActionToolbar({
  instance,
  currentUser,
  onAction,
  loading = false,
  onRefresh,
}) {
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showSshModal, setShowSshModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";
  const isRunning = instance?.status?.toUpperCase() === "RUNNING";
  const isTerminated = instance?.status?.toUpperCase() === "TERMINATED";

  const handleTerminateConfirm = () => {
    if (confirmInput === instance?.name || confirmInput === "TERMINATE") {
      onAction && onAction("TERMINATE");
      setShowTerminateModal(false);
      setConfirmInput("");
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status & Instance Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-[#bcc9cd] block">Current State:</span>
            <span
              className={`font-mono font-bold uppercase ${
                isRunning
                  ? "text-[#10b981]"
                  : isTerminated
                    ? "text-[#f43f5e]"
                    : "text-[#f59e0b]"
              }`}
            >
              {instance?.status || "UNKNOWN"}
            </span>
          </div>
          {!isAdmin && (
            <div className="flex items-center gap-1 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-2.5 py-1 rounded-lg text-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Read-Only mode: Lifecycle operations locked</span>
            </div>
          )}
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b1326] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-xs text-[#bcc9cd] hover:text-[#dae2fd] transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Sync</span>
            </button>
          )}

          {/* Web SSH Terminal */}
          <button
            disabled={!isRunning || isTerminated}
            onClick={() => setShowSshModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !isRunning || isTerminated
                ? "opacity-40 cursor-not-allowed border-transparent bg-[#1e293b]/40 text-[#64748b]"
                : "bg-[#171f33] hover:bg-[#1e293b] border-[#38bdf8]/40 text-[#38bdf8]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Connect (SSH)</span>
          </button>

          {/* Start Instance */}
          <button
            disabled={!isAdmin || isRunning || isTerminated || loading}
            onClick={() => onAction && onAction("START")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              !isAdmin || isRunning || isTerminated
                ? "opacity-40 cursor-not-allowed border-transparent bg-[#1e293b]/40 text-[#64748b]"
                : "bg-[#10b981]/15 hover:bg-[#10b981]/30 border-[#10b981]/40 text-[#10b981]"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start</span>
          </button>

          {/* Stop Instance */}
          <button
            disabled={!isAdmin || !isRunning || isTerminated || loading}
            onClick={() => onAction && onAction("STOP")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              !isAdmin || !isRunning || isTerminated
                ? "opacity-40 cursor-not-allowed border-transparent bg-[#1e293b]/40 text-[#64748b]"
                : "bg-[#f59e0b]/15 hover:bg-[#f59e0b]/30 border-[#f59e0b]/40 text-[#f59e0b]"
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>

          {/* Restart Instance */}
          <button
            disabled={!isAdmin || !isRunning || isTerminated || loading}
            onClick={() => onAction && onAction("RESTART")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              !isAdmin || !isRunning || isTerminated
                ? "opacity-40 cursor-not-allowed border-transparent bg-[#1e293b]/40 text-[#64748b]"
                : "bg-[#38bdf8]/15 hover:bg-[#38bdf8]/30 border-[#38bdf8]/40 text-[#38bdf8]"
            }`}
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Restart</span>
          </button>

          {/* Terminate Instance */}
          <button
            disabled={!isAdmin || isTerminated || loading}
            onClick={() => setShowTerminateModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              !isAdmin || isTerminated
                ? "opacity-40 cursor-not-allowed border-transparent bg-[#1e293b]/40 text-[#64748b]"
                : "bg-[#f43f5e]/15 hover:bg-[#f43f5e]/30 border-[#f43f5e]/40 text-[#f43f5e]"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Terminate</span>
          </button>
        </div>
      </div>

      {/* Terminate Confirmation Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-[#f43f5e]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-[#f43f5e] mb-4">
              <div className="p-2 bg-[#f43f5e]/15 rounded-xl border border-[#f43f5e]/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Terminate Cloud Instance</h3>
            </div>
            <p className="text-xs text-[#bcc9cd] leading-relaxed mb-4">
              Terminating{" "}
              <strong className="text-[#dae2fd]">{instance?.name}</strong> will
              permanently deprovision all attached EBS/Persistent Disk volumes
              and release its public IP. This action is irreversible.
            </p>
            <div className="mb-4">
              <label className="text-xs text-[#dae2fd] block mb-1">
                Type{" "}
                <span className="font-mono text-[#f43f5e] font-bold">
                  TERMINATE
                </span>{" "}
                to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="TERMINATE"
                className="w-full bg-[#0b1326] border border-[#1e293b] focus:border-[#f43f5e] rounded-lg px-3 py-2 text-xs font-mono text-[#dae2fd] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTerminateModal(false);
                  setConfirmInput("");
                }}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-medium rounded-lg text-[#dae2fd]"
              >
                Cancel
              </button>
              <button
                disabled={
                  confirmInput !== "TERMINATE" &&
                  confirmInput !== instance?.name
                }
                onClick={handleTerminateConfirm}
                className="px-4 py-2 bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg text-white transition-colors"
              >
                Confirm Deprovision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SSH Connection Details Modal */}
      {showSshModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-[#38bdf8]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#38bdf8]">
                <Terminal className="w-5 h-5" />
                <h3 className="text-base font-bold">
                  Web SSH & Bastion Tunnel
                </h3>
              </div>
              <button
                onClick={() => setShowSshModal(false)}
                className="text-[#64748b] hover:text-[#dae2fd] text-sm"
              >
                ✕
              </button>
            </div>
            <div className="bg-[#0b1326] p-4 rounded-xl border border-[#1e293b] font-mono text-xs text-[#38bdf8] space-y-2 mb-4">
              <p className="text-[#bcc9cd] text-[11px]">
                # Connect via OpenSSH:
              </p>
              <div className="bg-[#060e20] p-2.5 rounded border border-[#1e293b] select-all">
                ssh -i ~/.ssh/cloudpulse_id_rsa ubuntu@
                {instance?.public_ip || "198.51.100.42"}
              </div>
              <p className="text-[#bcc9cd] text-[11px] pt-2">
                # Bastion Proxy Command:
              </p>
              <div className="bg-[#060e20] p-2.5 rounded border border-[#1e293b] text-[#dae2fd] select-all">
                ssh -J bastion.cloudpulse.net -p 22 ubuntu@
                {instance?.private_ip || "10.0.1.24"}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSshModal(false)}
                className="px-4 py-2 bg-[#06b6d4] text-[#0b1326] font-semibold text-xs rounded-lg hover:bg-[#38bdf8]"
              >
                Close Terminal Helper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
