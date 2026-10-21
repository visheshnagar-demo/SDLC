import React, { useState } from "react";
import {
  Camera,
  Flashlight,
  RefreshCw,
  QrCode,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function GateScannerViewfinder({ onScan, isScanning, gateName }) {
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const sampleTestPasses = [
    {
      label: "Valid Season Pass",
      code: "HMAC_SHA256:GB-2026-X812:SEASON_VIP:AARAV_PATEL:VALID",
    },
    {
      label: "Valid Single-Day",
      code: "HMAC_SHA256:GB-2026-N014:SINGLE_DAY:PRIYA_SHAH:VALID",
    },
    {
      label: "Duplicate / Used Pass",
      code: "HMAC_SHA256:GB-2026-D999:ALREADY_USED_TEST",
    },
    {
      label: "Tampered / Invalid",
      code: "INVALID_SIGNATURE_TAMPERED_FORGERY_TOKEN",
    },
  ];

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScan(manualCode.trim());
    setManualCode("");
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-slate-950 font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className='text-lg font-bold text-white font-["Syne"]'>
              Optical Viewfinder
            </h2>
            <p className="text-xs text-slate-400">
              Scans 1D/2D Barcodes & HMAC SHA-256 Signed QR Passes
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 border border-amber-500/30 text-amber-300">
          {gateName}
        </span>
      </div>

      {/* Camera Viewfinder Box */}
      <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center group">
        {/* Background Grid Simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* Viewfinder Target Reticle */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-amber-400/60 rounded-2xl flex flex-col justify-between p-3 shadow-2xl">
          {/* Corner brackets */}
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
            <div className="w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
          </div>

          {/* Animated Laser Scanning Line */}
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-bounce" />

          <div className="flex justify-between">
            <div className="w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
            <div className="w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
          </div>
        </div>

        {/* Overlay scanning info */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Camera Active • Sub-200ms Validation
          </span>
          <button
            type="button"
            onClick={() => setTorchOn(!torchOn)}
            className={`p-1 rounded-md transition-colors ${torchOn ? "text-amber-400 bg-amber-500/20" : "text-slate-400 hover:text-white"}`}
            title="Toggle Torch Flashlight"
          >
            <Flashlight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Input / Handheld Scanner Barcode Mode */}
      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Direct Scanner Input / Barcode Gun Reader
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Scan QR payload or enter pass token..."
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || isScanning}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <span>Verify</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Quick Test QR Tokens for Security Testing */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Quick QA Test Triggers (Simulate Live Gate Scans)
        </span>
        <div className="grid grid-cols-2 gap-2">
          {sampleTestPasses.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onScan(p.code)}
              className="text-left px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-medium text-slate-300 hover:text-white transition-colors truncate"
            >
              ⚡ {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GateScannerViewfinder;
