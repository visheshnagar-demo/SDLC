import React, { useState } from "react";
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export function QualityMetrics({ qualityData = {}, onTriggerBackwash }) {
  const {
    ph_level = 7.2,
    turbidity_ntu = 1.4,
    tds_ppm = 145,
    pass_status = true,
    backwash_scheduled = false,
    filtration_unit = "Filtration Unit 2",
    operating_hours = 485,
  } = qualityData;

  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const phValid = ph_level >= 6.5 && ph_level <= 8.5;
  const turbidityValid = turbidity_ntu <= 2.0;
  const tdsValid = tds_ppm <= 300;

  const handleBackwash = async () => {
    setLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      if (onTriggerBackwash) {
        await onTriggerBackwash({ unit: filtration_unit });
      }
      setActionSuccess(
        "Filter backwash cycle initiated successfully! Valve redirected to cleaning loop.",
      );
    } catch (err) {
      setActionError(
        err?.response?.data?.detail || "Failed to trigger backwash cycle",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div
        className={`p-4 rounded-xl border flex items-start justify-between ${
          pass_status && phValid && turbidityValid
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}
      >
        <div className="flex items-center space-x-3">
          {pass_status && phValid && turbidityValid ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-base font-bold">
              {pass_status && phValid && turbidityValid
                ? "Water Quality Assurance: PASSED"
                : "Water Quality Out-Of-Bounds: DIVERSION ACTIVE"}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {pass_status && phValid && turbidityValid
                ? "Post-filtration water parameters comply with non-potable distribution thresholds."
                : "Turbidity or pH exceeds threshold. Output valve closed and diverted to secondary treatment."}
            </p>
          </div>
        </div>

        <button
          onClick={handleBackwash}
          disabled={loading}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-colors shadow disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-sky-400 ${loading ? "animate-spin" : ""}`}
          />
          <span>{loading ? "Initiating..." : "Trigger Backwash Cycle"}</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium">
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-medium">
          {actionError}
        </div>
      )}

      {/* Sensor Meter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* pH Level */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              pH Balance
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                phValid
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {phValid ? "Optimal" : "Out of Bounds"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">
              {ph_level}
            </span>
            <span className="text-xs text-slate-400">pH</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            Target Threshold:{" "}
            <span className="font-mono text-slate-200">6.5 - 8.5 pH</span>
          </div>
        </div>

        {/* Turbidity NTU */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Turbidity Index
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                turbidityValid
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {turbidityValid ? "Clear" : "High Clarity Risk"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">
              {turbidity_ntu}
            </span>
            <span className="text-xs text-slate-400">NTU</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            Max Threshold:{" "}
            <span className="font-mono text-slate-200">&le; 2.0 NTU</span>
          </div>
        </div>

        {/* TDS PPM */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Dissolved Solids
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                tdsValid
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {tdsValid ? "Acceptable" : "Elevated"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">
              {tds_ppm}
            </span>
            <span className="text-xs text-slate-400">PPM</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            Max Threshold:{" "}
            <span className="font-mono text-slate-200">&le; 300 PPM</span>
          </div>
        </div>
      </div>

      {/* Active Filtration Unit Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Filtration Unit Diagnostics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/50">
            <p className="text-slate-400">Active Unit:</p>
            <p className="text-sm font-bold text-white mt-1">
              {filtration_unit}
            </p>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/50">
            <p className="text-slate-400">Operating Hours:</p>
            <p className="text-sm font-bold text-sky-400 font-mono mt-1">
              {operating_hours} hrs / 500 hrs
            </p>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/50">
            <p className="text-slate-400">Backwash Status:</p>
            <p className="text-sm font-bold text-emerald-400 mt-1">
              {backwash_scheduled ? "SCHEDULED" : "READY / IDLE"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityMetrics;
