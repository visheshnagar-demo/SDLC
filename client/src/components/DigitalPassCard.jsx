import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Calendar,
  MapPin,
  QrCode,
  User,
  Clock,
  KeyRound,
} from "lucide-react";

export function DigitalPassCard({ pass }) {
  const [copied, setCopied] = useState(false);

  const qrSignature =
    pass.qr_signature_hash ||
    pass.qrPayload ||
    `HMAC_SHA256:${pass.pass_number || "GB-2026-X9"}:${Date.now()}:SIGN_SECURE_TOKEN_VALID`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(qrSignature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(pass, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `GarbaPass-${pass.pass_number || "2026"}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="relative max-w-md mx-auto bg-gradient-to-b from-[#0f172a] via-[#131b31] to-[#0b1326] border border-[#f59e0b]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
      {/* Decorative Top Accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header section with brand emblem */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-slate-950 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className='font-["Syne"] font-bold text-base tracking-wide bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent'>
              GARBAFEST 2026
            </span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Official Digital Pass
            </p>
          </div>
        </div>

        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          {pass.status || "ACTIVE"}
        </div>
      </div>

      {/* Ticket Main Details */}
      <div className="space-y-4 mb-6">
        <div>
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            {pass.tier_name || "SEASON PASS - ALL 9 NIGHTS"}
          </span>
          <h2 className='text-2xl font-bold font-["Syne"] text-white leading-tight'>
            {pass.event_title || "Navratri Mahotsav Celebration"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Attendee
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">
                {pass.attendee_name || "Aarav Patel"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Pass #
            </span>
            <span className="font-mono font-bold text-amber-300">
              {pass.pass_number || "GB-2026-X812"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Venue Gate
            </span>
            <div className="flex items-center gap-1 text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{pass.assigned_gate || "Gate 1 North / VIP"}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">
              Validity
            </span>
            <div className="flex items-center gap-1 text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{pass.valid_until || "Season 2026"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notched Divider for ticket effect */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute -left-10 w-6 h-6 bg-[#0b0f19] rounded-full" />
        <div className="absolute -right-10 w-6 h-6 bg-[#0b0f19] rounded-full" />
        <div className="w-full border-t-2 border-dashed border-slate-700/80" />
      </div>

      {/* Cryptographic QR Section */}
      <div className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-slate-900 shadow-xl">
        {/* Stylized high contrast QR pattern */}
        <div className="w-48 h-48 bg-slate-950 p-2 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-rose-500/10" />

          {/* Custom scannable stylized matrix */}
          <div className="w-full h-full border-4 border-amber-400/80 rounded-lg p-2 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="w-8 h-8 border-4 border-white bg-slate-950 flex items-center justify-center">
                <div className="w-3 h-3 bg-amber-400" />
              </div>
              <div className="w-8 h-8 border-4 border-white bg-slate-950 flex items-center justify-center">
                <div className="w-3 h-3 bg-amber-400" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-col">
              <QrCode className="w-12 h-12 text-white animate-pulse" />
              <span className="font-mono text-[9px] text-amber-300 font-bold tracking-tight">
                HMAC SHA-256 SIGNED
              </span>
            </div>

            <div className="flex justify-between">
              <div className="w-8 h-8 border-4 border-white bg-slate-950 flex items-center justify-center">
                <div className="w-3 h-3 bg-amber-400" />
              </div>
              <div className="w-8 h-8 border-2 border-amber-400/60 bg-amber-400/20" />
            </div>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="text-[10px] font-extrabold text-emerald-700 flex items-center justify-center gap-1 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ACTIVE / READY FOR GATE SCAN
          </span>
          <p className="text-[9px] font-mono text-slate-500 mt-0.5 truncate max-w-[240px]">
            SIG: {qrSignature.slice(0, 32)}...
          </p>
        </div>
      </div>

      {/* Security & Action Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{copied ? "Token Copied" : "Copy Token"}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
        >
          <Download className="w-3.5 h-3.5 text-slate-950" />
          <span>Save Pass</span>
        </button>
      </div>
    </div>
  );
}

export default DigitalPassCard;
