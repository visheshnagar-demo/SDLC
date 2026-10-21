import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  Calendar,
  User,
  Hash,
  Eye,
  Download,
  CheckCircle2,
  Clock,
} from "lucide-react";
import QRViewer from "./QRViewer";

export const DigitalPassCard = ({ pass, eventTitle, tierName }) => {
  const [showQRModal, setShowQRModal] = useState(false);

  if (!pass) return null;

  const qrData =
    pass.qr_payload ||
    pass.qr_signature_hash ||
    JSON.stringify({
      passId: pass.id,
      passNumber: pass.pass_number,
      attendee: pass.attendee_name,
      hash: pass.qr_signature_hash,
    });

  const isActive = pass.status === "ACTIVE" || pass.status === "ISSUED";
  const isUsed = pass.status === "USED" || pass.status === "CHECKED_IN";
  const isEntryExhausted = pass.entry_count >= pass.max_entries;

  const handleDownload = () => {
    window.print();
  };

  return (
    <>
      <div className="relative group bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border border-[#F59E0B]/30 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-300 hover:border-[#F59E0B]/60">
        {/* Ticket Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-widest text-[#F59E0B] uppercase bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                {tierName || "GARBA ACCESS PASS"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  isActive && !isEntryExhausted
                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-700/30"
                    : isUsed || isEntryExhausted
                      ? "bg-rose-900/30 text-rose-400 border border-rose-700/30"
                      : "bg-amber-900/30 text-amber-300 border border-amber-700/30"
                }`}
              >
                {isActive && !isEntryExhausted ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {pass.status || (isEntryExhausted ? "EXHAUSTED" : "ACTIVE")}
              </span>
            </div>
            <h3 className="font-display font-extrabold text-xl text-slate-100 mt-2">
              {eventTitle || "GarbaFest 2026 Night"}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">
              Pass #
            </span>
            <span className="text-sm font-bold text-[#F59E0B] font-mono">
              {pass.pass_number || pass.id?.substring(0, 8)}
            </span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          {/* Attendee Specs */}
          <div className="sm:col-span-2 space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-[#F59E0B]" />
              <div>
                <span className="text-[11px] text-slate-400 block">
                  Attendee Name
                </span>
                <span className="font-bold text-slate-100 text-sm">
                  {pass.attendee_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Hash className="w-4 h-4 text-[#BE185D]" />
              <div>
                <span className="text-[11px] text-slate-400 block">
                  Gate Entries
                </span>
                <span className="font-semibold text-slate-200">
                  {pass.entry_count ?? 0} / {pass.max_entries ?? 1} Scanned
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                HMAC SHA-256 Signed
              </span>
              <span className="font-mono text-slate-400 truncate max-w-[140px]">
                {pass.qr_signature_hash
                  ? pass.qr_signature_hash.substring(0, 16) + "..."
                  : "Tamper-Proof"}
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl shadow-black/40">
            <QRCodeSVG
              value={qrData}
              size={120}
              level="H"
              includeMargin={false}
              className="rounded"
            />
            <span className="text-[9px] font-bold text-slate-800 tracking-wider mt-1.5 uppercase">
              Scan at Gate
            </span>
          </div>
        </div>

        {/* Ticket Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Full-Screen QR</span>
          </button>
          <button
            onClick={handleDownload}
            className="py-2 px-4 rounded-xl bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print / Save</span>
          </button>
        </div>
      </div>

      {showQRModal && (
        <QRViewer
          pass={pass}
          qrData={qrData}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </>
  );
};

export default DigitalPassCard;
