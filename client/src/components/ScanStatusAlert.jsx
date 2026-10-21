import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Clock,
  User,
  Ticket,
  MapPin,
} from "lucide-react";

export function ScanStatusAlert({ result, onDismiss }) {
  if (!result) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className='text-lg font-bold text-slate-200 font-["Syne"]'>
            Awaiting Pass Scan
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Point the camera viewfinder at an attendee's digital QR pass or
            trigger a test payload.
          </p>
        </div>
      </div>
    );
  }

  const status = (result.status || "").toUpperCase();
  const isValid = status === "VALID" || status === "SUCCESS";
  const isUsed =
    status === "ALREADY_USED" || status === "DUPLICATE" || status === "USED";

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border-2 shadow-2xl transition-all animate-in fade-in zoom-in duration-300 ${
        isValid
          ? "bg-emerald-950/40 border-emerald-500 shadow-emerald-500/20"
          : isUsed
            ? "bg-rose-950/40 border-rose-500 shadow-rose-500/20"
            : "bg-amber-950/40 border-amber-500 shadow-amber-500/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              isValid
                ? "bg-emerald-500 text-slate-950"
                : isUsed
                  ? "bg-rose-500 text-white animate-bounce"
                  : "bg-amber-500 text-slate-950"
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isUsed ? (
              <XCircle className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          <div>
            <span
              className={`text-xs font-extrabold uppercase tracking-widest block ${
                isValid
                  ? "text-emerald-400"
                  : isUsed
                    ? "text-rose-400"
                    : "text-amber-400"
              }`}
            >
              {isValid
                ? "ACCESS GRANTED"
                : isUsed
                  ? "ACCESS DENIED • DUPLICATE ENTRY"
                  : "VERIFICATION FAILED"}
            </span>
            <h2 className='text-2xl font-black font-["Syne"] text-white'>
              {isValid
                ? "VALID ENTRY"
                : isUsed
                  ? "ALREADY USED"
                  : "INVALID / TAMPERED PASS"}
            </h2>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Message and Audit Details */}
      <div className="mt-5 space-y-4">
        <p className="text-sm text-slate-200 font-medium">
          {result.message ||
            (isValid
              ? "Pass authenticated successfully via HMAC SHA-256 signature."
              : "Security warning: Pass verification failed.")}
        </p>

        <div className="grid grid-cols-2 gap-3 bg-black/40 rounded-2xl p-4 border border-white/10 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Attendee
            </span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {result.attendeeName || result.attendee_name || "Aarav Patel"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Pass Tier
            </span>
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Ticket className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {result.tierName || result.tier_name || "Season VIP Pass"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Gate
            </span>
            <div className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {result.gateIdentifier || result.gate || "Gate 1 North"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Timestamp
            </span>
            <div className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {result.checkedInAt || result.timestamp || "Just now"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanStatusAlert;
