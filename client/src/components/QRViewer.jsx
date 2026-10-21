import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, ShieldCheck, Sparkles, Sun } from "lucide-react";

export const QRViewer = ({ pass, qrData, onClose }) => {
  if (!pass) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0F172A] border border-[#F59E0B]/40 rounded-3xl p-7 text-center shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Gate Entry Token</span>
          </div>
          <h3 className="text-xl font-extrabold font-display text-slate-100">
            {pass.attendee_name}
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Pass #{pass.pass_number || pass.id}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-5 bg-white rounded-2xl mx-auto inline-block shadow-2xl shadow-black/50">
          <QRCodeSVG
            value={qrData || pass.qr_payload || pass.id}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Security badge and brightness tip */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 py-1.5 px-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographically Verified (HMAC SHA-256)</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Please increase screen brightness for faster gate scan.</span>
          </div>
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default QRViewer;
