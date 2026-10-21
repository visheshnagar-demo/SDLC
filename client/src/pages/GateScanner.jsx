import React, { useState } from "react";
import { validateGatePass } from "../services/api";
import GateScannerViewfinder from "../components/GateScannerViewfinder";
import ScanStatusAlert from "../components/ScanStatusAlert";
import {
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export const GateScanner = () => {
  const [activeGate, setActiveGate] = useState("GATE_1_NORTH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const handleScan = async (rawQrPayload) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await validateGatePass({
        gateIdentifier: activeGate,
        qrPayload: rawQrPayload,
      });

      setScanResult(response);
      setScanHistory((prev) => [
        {
          id: Date.now(),
          status: response.status,
          message: response.message,
          attendeeName: response.attendeeName,
          passNumber: response.passNumber,
          gate: activeGate,
          time: new Date(),
        },
        ...prev.slice(0, 19), // keep last 20
      ]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        "Network or signature verification failure.";
      const failResult = {
        status: "INVALID",
        message: errorMsg,
        checkedInAt: new Date().toISOString(),
      };
      setScanResult(failResult);
      setScanHistory((prev) => [
        {
          id: Date.now(),
          status: "INVALID",
          message: errorMsg,
          gate: activeGate,
          time: new Date(),
        },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Gate Security Access Control</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-100 mt-1">
            Real-Time Entry Scanner
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Instantaneous optical QR validation with duplicate entry detection.
          </p>
        </div>
      </div>

      {/* Main Grid: Viewfinder + Scan Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Viewfinder */}
        <div>
          <GateScannerViewfinder
            onScanResult={handleScan}
            isProcessing={isProcessing}
            activeGate={activeGate}
            onGateChange={setActiveGate}
          />
        </div>

        {/* Right Column: Scan Result Alert */}
        <div>
          <ScanStatusAlert scanResult={scanResult} />
        </div>
      </div>

      {/* Recent Scans Telemetry Log */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-[#F59E0B]" />
            <span>Live Gate Check-in Telemetry</span>
          </h3>
          <span className="text-xs text-slate-400">
            {scanHistory.length} Recent Scan
            {scanHistory.length !== 1 ? "s" : ""}
          </span>
        </div>

        {scanHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center italic">
            No passes scanned yet in this session.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Attendee</th>
                  <th className="py-2.5 px-3">Gate</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scanHistory.map((scan) => {
                  const isOk =
                    scan.status === "VALID" || scan.status === "SUCCESS";
                  const isDup = scan.status === "ALREADY_USED";

                  return (
                    <tr key={scan.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOk
                              ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                              : isDup
                                ? "bg-rose-900/30 text-rose-400 border border-rose-800/40"
                                : "bg-amber-900/30 text-amber-300 border border-amber-800/40"
                          }`}
                        >
                          {isOk ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isDup ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {scan.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {scan.attendeeName || "Unknown Pass"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {scan.gate}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {scan.time.toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">
                        {scan.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GateScanner;
