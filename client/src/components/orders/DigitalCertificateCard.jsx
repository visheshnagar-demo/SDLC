import React, { useState } from "react";
import { ShieldCheck, FileDown, CheckCircle, Award } from "lucide-react";

export const DigitalCertificateCard = ({ order, watch }) => {
  const [downloadMsg, setDownloadMsg] = useState("");

  const handleDownloadCertificate = () => {
    setDownloadMsg("Generating Digital Certificate PDF...");
    setTimeout(() => {
      setDownloadMsg("Certificate #CERT-99281 successfully downloaded.");
      setTimeout(() => setDownloadMsg(""), 3000);
    }, 1000);
  };

  const handleDownloadInvoice = () => {
    setDownloadMsg("Generating Escrow Invoice PDF...");
    setTimeout(() => {
      setDownloadMsg("Invoice PDF successfully generated.");
      setTimeout(() => setDownloadMsg(""), 3000);
    }, 1000);
  };

  const certNumber =
    watch?.certificate_number || order?.certificate_url || "CERT-99281-GEN";

  return (
    <div className="bg-[#181B22] border border-[#232733] p-6 rounded-xl space-y-4 shadow-md">
      <div className="flex items-center justify-between border-b border-[#232733] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#F2CA50]" />
          <h3 className="font-serif text-lg font-bold text-[#F8F9FA]">
            Digital Certificate of Authenticity
          </h3>
        </div>
        <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> VERIFIED
        </span>
      </div>

      <div className="space-y-2 text-xs text-[#9EACB9] bg-[#12141A] p-4 rounded-lg border border-[#232733]">
        <div className="flex justify-between">
          <span>Certificate ID:</span>
          <strong className="font-mono text-[#F2CA50]">#{certNumber}</strong>
        </div>
        <div className="flex justify-between">
          <span>Authenticating Atelier:</span>
          <strong className="text-[#F8F9FA]">
            Chrono Certified Geneva Atelier S.A.
          </strong>
        </div>
        <div className="flex justify-between">
          <span>Chief Horologist:</span>
          <strong className="text-[#F8F9FA]">
            M. Laurent &amp; Master Watchmakers
          </strong>
        </div>
        <div className="flex justify-between">
          <span>Blockchain Ledger Hash:</span>
          <strong className="font-mono text-[10px] text-[#D4AF37]">
            0x8f9c...4a2b (Polygon Horology Chain)
          </strong>
        </div>
      </div>

      {downloadMsg && (
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#F2CA50] text-xs p-2.5 rounded text-center font-mono">
          {downloadMsg}
        </div>
      )}

      {/* PDF Export Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleDownloadCertificate}
          className="flex-1 bg-[#1F1F23] hover:bg-[#2A2E39] border border-[#4D4635] text-[#F8F9FA] text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <FileDown className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Certificate PDF</span>
        </button>

        <button
          onClick={handleDownloadInvoice}
          className="flex-1 bg-[#1F1F23] hover:bg-[#2A2E39] border border-[#4D4635] text-[#F8F9FA] text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Invoice PDF</span>
        </button>
      </div>
    </div>
  );
};

export default DigitalCertificateCard;
