import React, { useState } from "react";
import { Droplets, AlertTriangle, CheckCircle, Calculator } from "lucide-react";

export const MilkingLogForm = ({ cows = [], onSaveLog, defaultCowId = "" }) => {
  const [cowId, setCowId] = useState(
    defaultCowId || cows[0]?.id || cows[0]?.tag_id || "",
  );
  const [loggingDate, setLoggingDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [morningYield, setMorningYield] = useState("");
  const [eveningYield, setEveningYield] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const mYield = parseFloat(morningYield) || 0;
  const eYield = parseFloat(eveningYield) || 0;
  const totalYield = parseFloat((mYield + eYield).toFixed(2));

  // Example baseline average for anomaly detection
  const historicalAvg = 24.5;
  const dropPercentage =
    totalYield > 0 ? ((historicalAvg - totalYield) / historicalAvg) * 100 : 0;
  const hasSevereDrop = totalYield > 0 && dropPercentage >= 30;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!cowId) {
      setErrorMsg("Please select a cow.");
      return;
    }

    if (mYield <= 0 && eYield <= 0) {
      setErrorMsg(
        "Please enter at least one valid yield amount (morning or evening).",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        cow_id: cowId,
        logging_date: loggingDate,
        morning_yield_liters: mYield,
        evening_yield_liters: eYield,
        total_yield_liters: totalYield,
        yield_drop_alert: hasSevereDrop,
        notes: notes.trim(),
      };

      await onSaveLog(payload);
      setSuccessMsg(
        `Milking session recorded successfully (${totalYield} L total).`,
      );
      setMorningYield("");
      setEveningYield("");
      setNotes("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to record milking session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-4">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <Droplets className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Record Daily Milking Session
          </h2>
          <p className="text-xs text-slate-500">
            Log morning and evening yield for individual cows
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Cattle (Tag ID) *
            </label>
            <select
              value={cowId}
              onChange={(e) => setCowId(e.target.value)}
              required
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Cow --</option>
              {cows.map((c) => (
                <option key={c.id || c.tag_id} value={c.id || c.tag_id}>
                  {c.tag_id} - {c.breed} ({c.health_status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Logging Date *
            </label>
            <input
              type="date"
              value={loggingDate}
              onChange={(e) => setLoggingDate(e.target.value)}
              required
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Morning Yield (L)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 12.5"
              value={morningYield}
              onChange={(e) => setMorningYield(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evening Yield (L)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 11.0"
              value={eveningYield}
              onChange={(e) => setEveningYield(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Calculated Total</span>
              <Calculator className="h-3.5 w-3.5 text-slate-400" />
            </label>
            <div className="w-full text-sm font-bold px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center justify-between">
              <span>{totalYield} Liters</span>
            </div>
          </div>
        </div>

        {/* Anomaly Detection Feedback */}
        {hasSevereDrop && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              ⚠️ <strong>Warning:</strong> Total yield of {totalYield}L is{" "}
              <strong>{dropPercentage.toFixed(1)}% below</strong> expected
              baseline (24.5L). System will trigger a health alert.
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Session Notes / Observations
          </label>
          <input
            type="text"
            placeholder="e.g. Normal feed intake, slight lethargy noted"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-xs"
        >
          <Droplets className="h-4 w-4" />
          <span>
            {submitting ? "Recording..." : "Save Milking Session Log"}
          </span>
        </button>
      </form>
    </div>
  );
};

export default MilkingLogForm;
