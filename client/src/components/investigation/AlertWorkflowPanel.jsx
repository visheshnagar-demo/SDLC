import React, { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  XCircle,
  ShieldAlert,
  Check,
} from "lucide-react";

export default function AlertWorkflowPanel({
  alert = {},
  onStatusUpdate,
  updating = false,
  error = null,
}) {
  const [selectedStatus, setSelectedStatus] = useState(alert.status || "NEW");
  const [notes, setNotes] = useState(alert.notes || "");
  const [successMessage, setSuccessMessage] = useState("");

  const statusActions = [
    {
      status: "UNDER_REVIEW",
      label: "Mark Under Review",
      icon: AlertTriangle,
      color: "bg-amber-500 hover:bg-amber-600 text-white",
      activeColor: "ring-2 ring-amber-500 bg-amber-500 text-white",
    },
    {
      status: "ESCALATED",
      label: "Escalate to Tier 2",
      icon: ArrowUpRight,
      color: "bg-purple-600 hover:bg-purple-700 text-white",
      activeColor: "ring-2 ring-purple-600 bg-purple-600 text-white",
    },
    {
      status: "CONFIRMED_FRAUD",
      label: "Confirm Fraud",
      icon: ShieldAlert,
      color: "bg-rose-600 hover:bg-rose-700 text-white",
      activeColor: "ring-2 ring-rose-600 bg-rose-600 text-white",
    },
    {
      status: "DISMISSED",
      label: "Dismiss / False Positive",
      icon: XCircle,
      color: "bg-slate-200 hover:bg-slate-300 text-slate-800",
      activeColor: "ring-2 ring-slate-400 bg-slate-300 text-slate-900",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    if (!selectedStatus) return;

    try {
      await onStatusUpdate({
        status: selectedStatus,
        notes: notes.trim(),
        actor: "Sarah Jenkins (Analyst)",
      });
      setSuccessMessage("Alert status updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      // Error handled by parent component state
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
          Investigation Actions &amp; Workflow
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-100 text-slate-700">
          Current: {alert.status || "NEW"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Select Decision / Escalation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statusActions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedStatus === action.status;
              return (
                <button
                  type="button"
                  key={action.status}
                  onClick={() => setSelectedStatus(action.status)}
                  className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                    isSelected ? action.activeColor : action.color
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="investigation-notes"
            className="block text-xs font-semibold text-slate-700"
          >
            Investigation Notes &amp; Justification
          </label>
          <textarea
            id="investigation-notes"
            rows="4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add case notes, customer contact remarks, suspicious pattern evidence, or justification..."
            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
          ></textarea>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={updating}
          className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center justify-center space-x-1.5"
        >
          {updating ? (
            <span>Updating Status...</span>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Update Alert Status</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
