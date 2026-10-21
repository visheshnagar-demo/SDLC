import React, { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Clock,
  User,
  Ticket,
} from "lucide-react";

// Web Audio API synth beep
const playFeedbackTone = (status) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (status === "VALID" || status === "SUCCESS") {
      // High pitch double beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (status === "ALREADY_USED") {
      // Low buzz
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Harsh error buzz
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
};

export const ScanStatusAlert = ({ scanResult }) => {
  useEffect(() => {
    if (scanResult?.status) {
      playFeedbackTone(scanResult.status);
    }
  }, [scanResult]);

  if (!scanResult) {
    return (
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Ticket className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="font-display font-bold text-base text-slate-300">
          Awaiting Gate Scan
        </h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Point the optical viewfinder towards the attendee's pass QR code or
          input the token manually.
        </p>
      </div>
    );
  }

  const status = scanResult.status || "UNKNOWN";
  const isValid = status === "VALID" || status === "SUCCESS";
  const isDuplicate = status === "ALREADY_USED" || status === "DUPLICATE_SCAN";
  const isInvalid = !isValid && !isDuplicate;

  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300 ${
        isValid
          ? "bg-emerald-950/40 border-emerald-500 shadow-2xl shadow-emerald-500/20"
          : isDuplicate
            ? "bg-rose-950/40 border-rose-500 shadow-2xl shadow-rose-500/20 animate-shake"
            : "bg-amber-950/40 border-amber-500 shadow-2xl shadow-amber-500/20"
      }`}
    >
      {/* Alert Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-white/10">
        {isValid && (
          <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
        )}
        {isDuplicate && (
          <XCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
        )}
        {isInvalid && (
          <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
        )}

        <div>
          <h2
            className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight ${
              isValid
                ? "text-emerald-400"
                : isDuplicate
                  ? "text-rose-400"
                  : "text-amber-400"
            }`}
          >
            {isValid
              ? "VALID ENTRY - ACCESS GRANTED"
              : isDuplicate
                ? "ALREADY USED - DUPLICATE ENTRY"
                : "INVALID / FORGED PASS TOKEN"}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {scanResult.message ||
              (isValid
                ? "Pass successfully checked in."
                : "Gate entry denied.")}
          </p>
        </div>
      </div>

      {/* Pass Metadata Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {scanResult.attendeeName && (
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#F59E0B]" /> Attendee Name
            </span>
            <span className="font-bold text-slate-100 text-sm block">
              {scanResult.attendeeName}
            </span>
          </div>
        )}

        {scanResult.tierName && (
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-[#BE185D]" /> Pass Category
            </span>
            <span className="font-bold text-[#F59E0B] text-sm block">
              {scanResult.tierName}
            </span>
          </div>
        )}

        {scanResult.passNumber && (
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-mono">
              Pass Number
            </span>
            <span className="font-mono font-bold text-slate-200 block">
              {scanResult.passNumber}
            </span>
          </div>
        )}

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> Scan Timestamp
          </span>
          <span className="font-semibold text-slate-200 block">
            {scanResult.checkedInAt
              ? new Date(scanResult.checkedInAt).toLocaleTimeString()
              : new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {isDuplicate && scanResult.firstCheckedInAt && (
        <div className="mt-4 p-3 bg-rose-900/30 border border-rose-700/50 rounded-xl text-xs text-rose-300">
          ⚠️ <strong>Prior Check-in:</strong> This pass was already scanned at{" "}
          {new Date(scanResult.firstCheckedInAt).toLocaleTimeString()}. Prevent
          duplicate access.
        </div>
      )}
    </div>
  );
};

export default ScanStatusAlert;
