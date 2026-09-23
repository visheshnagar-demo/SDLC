import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import emailService from "../services/api";

const CATEGORIES = [
  "Work",
  "Personal",
  "Urgent",
  "Promotional",
  "Uncategorized",
];

export function ManualOverrideModal({ isOpen, email, onClose, onSaved }) {
  const [selectedCategory, setSelectedCategory] = useState("Work");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (email) {
      setSelectedCategory(email.category || "Work");
      setNotes("");
      setError(null);
    }
  }, [email]);

  if (!isOpen || !email) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updated = await emailService.overrideCategory(email.id, {
        category: selectedCategory,
        notes: notes.trim() || undefined,
      });
      if (onSaved) {
        onSaved(updated);
      }
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save category override.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3
              id="override-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Manual Category Override
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reassign classification and track in audit trail
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Subject
            </label>
            <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 line-clamp-2">
              {email.subject || "(No Subject)"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
            <div>
              <span className="text-slate-500 block">Current Category:</span>
              <span className="font-semibold text-slate-900">
                {email.category || "Uncategorized"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">AI Confidence:</span>
              <span className="font-semibold text-slate-900">
                {email.confidence_score !== null &&
                email.confidence_score !== undefined
                  ? `${Math.round(email.confidence_score * 100)}%`
                  : "N/A"}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="category-select"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              New Category
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="override-notes"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Override Reason / Notes (Optional)
            </label>
            <textarea
              id="override-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., False positive; promotional flyer misclassified as Work..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Override</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManualOverrideModal;
