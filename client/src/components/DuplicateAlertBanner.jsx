import React from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";

export default function DuplicateAlertBanner({
  duplicateInmate,
  onDismiss,
  onProceedAnyway,
}) {
  if (!duplicateInmate) return null;

  return (
    <div className="bg-[#451A03] border-l-4 border-[#F59E0B] p-4 rounded-r-lg mb-6 text-[#F8FAFC] shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-6 h-6 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[#F59E0B] text-base flex items-center gap-2">
              DUPLICATE INMATE RECORD DETECTED
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Matching SSN / Biometric Hash found for inmate{" "}
              <span className="font-semibold text-white">
                {duplicateInmate.first_name} {duplicateInmate.last_name}
              </span>{" "}
              (Booking #:{" "}
              <span className="font-mono text-yellow-300">
                {duplicateInmate.booking_number || "BK-89042"}
              </span>
              ).
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={onProceedAnyway}
                className="px-3 py-1.5 bg-[#F59E0B] hover:bg-yellow-600 text-slate-950 font-bold text-xs rounded transition-colors"
              >
                Supervisory Override & Continue
              </button>
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-white"
            aria-label="Dismiss duplicate alert"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
