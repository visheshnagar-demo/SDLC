import React, { useState, useEffect, useRef } from "react";
import { Camera, KeyRound, RefreshCw, VideoOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export const GateScannerViewfinder = ({
  onScanResult,
  isProcessing,
  activeGate,
  onGateChange,
}) => {
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);

  const startScanner = async () => {
    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode("qr-reader-viewport");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!isProcessing) {
            onScanResult(decodedText);
          }
        },
        () => {
          // Scanning frame with no QR detected, ignore frame
        },
      );
      setCameraActive(true);
    } catch {
      setCameraError(
        "Camera access denied or unavailable. You can use manual entry below.",
      );
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && cameraActive) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [cameraActive]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanResult(manualCode.trim());
    setManualCode("");
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Gate Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#F59E0B]" />
            <span>Gate Optical Scanner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sub-200ms HMAC SHA-256 pass verification & check-in terminal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="gate-selector"
            className="text-xs font-semibold text-slate-300"
          >
            Current Gate:
          </label>
          <select
            id="gate-selector"
            value={activeGate}
            onChange={(e) => onGateChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
          >
            <option value="GATE_1_NORTH">Gate 1 (North Main)</option>
            <option value="GATE_2_SOUTH">Gate 2 (South General)</option>
            <option value="GATE_3_VIP">Gate 3 (VIP & Artists)</option>
            <option value="GATE_4_WEST">Gate 4 (West Express)</option>
          </select>
        </div>
      </div>

      {/* Camera Viewport or Mock Optical Target */}
      <div className="relative w-full aspect-video sm:aspect-[4/3] max-h-72 bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <div id="qr-reader-viewport" className="w-full h-full" />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 space-y-4">
            <div className="w-36 h-36 border-2 border-dashed border-[#F59E0B]/60 rounded-2xl relative flex items-center justify-center">
              <div className="w-28 h-28 border-2 border-emerald-500/80 rounded-xl animate-pulse flex items-center justify-center">
                <Camera className="w-8 h-8 text-slate-400" />
              </div>
            </div>

            {cameraError ? (
              <p className="text-xs text-amber-400 max-w-xs">{cameraError}</p>
            ) : (
              <button
                type="button"
                onClick={startScanner}
                className="py-2 px-4 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F59E0B]/20 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Activate Camera Scanner</span>
              </button>
            )}
          </div>
        )}

        {cameraActive && (
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={stopScanner}
              className="py-1.5 px-3 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span>Turn Off Camera</span>
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw className="w-8 h-8 text-[#F59E0B] animate-spin" />
            <span className="text-xs font-bold text-slate-200">
              Verifying HMAC Signature...
            </span>
          </div>
        )}
      </div>

      {/* Manual Code / Barcode Gun Input */}
      <form
        onSubmit={handleManualSubmit}
        className="pt-2 border-t border-slate-800 space-y-2"
      >
        <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-[#F59E0B]" />
          <span>Manual Token Entry / Barcode Gun Input</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Scan with handheld gun or enter pass token / ID..."
            className="flex-1 bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || isProcessing}
            className="py-2.5 px-5 bg-gradient-to-r from-[#F59E0B] to-[#BE185D] hover:opacity-95 text-slate-950 font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-all"
          >
            Validate Pass
          </button>
        </div>
      </form>
    </div>
  );
};

export default GateScannerViewfinder;
