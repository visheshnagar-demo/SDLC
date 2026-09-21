import React, { useEffect, useState } from "react";
import {
  Activity,
  Plus,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  HeartPulse,
} from "lucide-react";
import { getFlocks, getHealthLogs, createHealthLog } from "../services/api";

export function HealthLogs() {
  const [flocks, setFlocks] = useState([]);
  const [healthLogs, setHealthLogsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedFlockId, setSelectedFlockId] = useState("");
  const [logType, setLogType] = useState("MORTALITY");
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const [flocksRes, healthRes] = await Promise.all([
        getFlocks(),
        getHealthLogs(),
      ]);
      const activeFlocks = (flocksRes || []).filter(
        (f) => f.status === "Active",
      );
      setFlocks(activeFlocks);
      if (activeFlocks.length > 0) setSelectedFlockId(activeFlocks[0].id);

      setHealthLogsList(healthRes || []);
    } catch (err) {
      console.error("Error loading health log data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const selectedFlock = flocks.find((f) => f.id === selectedFlockId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const qty = parseInt(quantity, 10) || 0;

    if (!selectedFlock) {
      setMessage({ type: "error", text: "Please select an active flock." });
      return;
    }

    if (qty <= 0) {
      setMessage({ type: "error", text: "Quantity must be at least 1." });
      return;
    }

    // Business Rule Edge Case: Mortality count > active hen count returns HTTP 400 error
    if (logType === "MORTALITY" && qty > selectedFlock.active_count) {
      setMessage({
        type: "error",
        text: `Mortality exceeds active hen count! Flock ${selectedFlock.name} has only ${selectedFlock.active_count} active hens.`,
      });
      return;
    }

    const payload = {
      flock_id: selectedFlockId,
      flock_name: selectedFlock.name,
      log_date: logDate,
      log_type: logType,
      quantity: qty,
      notes: notes || `${logType} event recorded.`,
    };

    try {
      setSubmitting(true);
      await createHealthLog(payload);

      // Auto-decrement active hen count locally if mortality
      if (logType === "MORTALITY") {
        setFlocks((prev) =>
          prev.map((f) =>
            f.id === selectedFlockId
              ? { ...f, active_count: Math.max(0, f.active_count - qty) }
              : f,
          ),
        );
      }

      setHealthLogsList((prev) => [
        { ...payload, id: `hlog-${Date.now()}` },
        ...prev,
      ]);

      setMessage({
        type: "success",
        text: `Logged ${logType} event for ${selectedFlock.name}.${
          logType === "MORTALITY"
            ? ` Active hen count auto-adjusted to ${Math.max(
                0,
                selectedFlock.active_count - qty,
              )}.`
            : ""
        }`,
      });

      setNotes("");
      setQuantity(1);
    } catch (err) {
      console.error("Error creating health log", err);
      const detail =
        err.response?.data?.detail || "Failed to record health event.";
      setMessage({
        type: "error",
        text:
          typeof detail === "string"
            ? detail
            : "Validation error submitting log.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Flock Health, Vaccination &amp; Mortality Logs
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Record veterinary health events, vaccinations, and daily mortality
          (with auto-adjusting active hen count).
        </p>
      </div>

      {/* Auto-Decrement Impact Information Banner */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <span className="font-bold block">
            Biosecurity &amp; Flock Population Rule:
          </span>
          Logging a <strong>MORTALITY</strong> event automatically decrements
          the active hen count of the selected flock and updates laying rate
          calculations in real time.
        </div>
      </div>

      {/* Action Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Grid Layout: Form & Audit Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Logger Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            <span>Record Health Event</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Flock *
              </label>
              <select
                value={selectedFlockId}
                onChange={(e) => setSelectedFlockId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.active_count} active hens)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Event Log Type *
              </label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="MORTALITY">
                  MORTALITY (Auto-decrements active hens)
                </option>
                <option value="VACCINATION">
                  VACCINATION (Routine Booster)
                </option>
                <option value="ILLNESS">ILLNESS / ISOLATION</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Quantity / Count *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Log Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Notes / Diagnosis / Vaccine Name
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Newcastle booster administered or heat stress cause..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>
                {submitting ? "Logging Event..." : "Record Health Log"}
              </span>
            </button>
          </form>
        </div>

        {/* Health Audit History Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Health &amp; Mortality Audit Ledger
            </h3>
            <span className="text-xs text-slate-500">
              {healthLogs.length} Events Logged
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Log Date</th>
                  <th className="py-3 px-4">Flock</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4 text-center">Count</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {healthLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No health or mortality events logged.
                    </td>
                  </tr>
                ) : (
                  healthLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                        {log.log_date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">
                        {log.flock_name || log.flock_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            log.log_type === "MORTALITY"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : log.log_type === "VACCINATION"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {log.log_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {log.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {log.notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthLogs;
