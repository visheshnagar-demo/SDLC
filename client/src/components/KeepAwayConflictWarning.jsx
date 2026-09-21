import React from "react";
import { ShieldAlert, AlertCircle, Key } from "lucide-react";

export default function KeepAwayConflictWarning({
  conflictDetails,
  onAuthorizeOverride,
  onCancel,
}) {
  if (!conflictDetails) return null;

  return (
    <div className="bg-[#450A0A] border-2 border-[#EF4444] rounded-xl p-5 mb-6 text-[#F8FAFC] shadow-2xl">
      <div className="flex items-start space-x-3">
        <ShieldAlert className="w-8 h-8 text-[#EF4444] flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-[#EF4444] tracking-wide uppercase flex items-center gap-2">
              KEEP-AWAY INCOMPATIBILITY CONFLICT ALERT
            </h3>
            <span className="bg-[#EF4444] text-black font-extrabold text-xs px-2.5 py-0.5 rounded">
              HARD BLOCK
            </span>
          </div>

          <p className="text-sm text-slate-200 mt-2 font-medium">
            Inmate{" "}
            <span className="font-bold text-white underline">
              {conflictDetails.inmate_name || "Selected Inmate"}
            </span>{" "}
            cannot be assigned to cell{" "}
            <span className="font-bold text-yellow-300">
              {conflictDetails.cell_number || "Block A-102"}
            </span>
            .
          </p>

          <div className="bg-[#18181B] border border-red-500/30 rounded-lg p-3 mt-3 text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2 text-red-400 font-semibold">
              <AlertCircle className="w-4 h-4" /> Conflict Reason:{" "}
              {conflictDetails.reason ||
                "Rival Gang Affiliation & Co-defendant Keep-Away"}
            </div>
            <div>
              <span className="text-slate-400">
                Conflicting Inmate in Unit:
              </span>{" "}
              <span className="font-semibold text-white">
                {conflictDetails.conflict_inmate_name ||
                  "Damian Vance (BK-2025-0188)"}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Security Rule:</span> NIST SP
              800-53 Incompatible Cell Co-assignment Prohibition
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-800/50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-yellow-400" /> Requires Housing
              Supervisor PIN & Authorization
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors"
              >
                Cancel Assignment
              </button>
              <button
                type="button"
                onClick={onAuthorizeOverride}
                className="px-4 py-2 bg-[#EF4444] hover:bg-red-700 text-white font-bold text-xs rounded transition-colors flex items-center gap-1 shadow-md"
              >
                Supervisor Override Sign-Off
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
