import React, { useState } from "react";
import {
  X,
  Tag,
  Check,
  AlertCircle,
  Clock,
  User,
  Mail,
  FileText,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { overrideCategory } from "../services/api";

const CATEGORIES = ["Work", "Personal", "Urgent", "Promotional"];

const CATEGORY_STYLES = {
  Work: {
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    active: "bg-blue-600 text-white border-blue-600",
  },
  Personal: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    active: "bg-emerald-600 text-white border-emerald-600",
  },
  Urgent: {
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    active: "bg-rose-600 text-white border-rose-600",
  },
  Promotional: {
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    active: "bg-purple-600 text-white border-purple-600",
  },
};

export const CategoryOverrideModal = ({
  email,
  onClose,
  onOverrideSuccess,
}) => {
  const currentCategory =
    email?.classification?.user_override_category ||
    email?.classification?.ai_category ||
    "Work";

  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!email) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await overrideCategory(email.id, selectedCategory);
      if (onOverrideSuccess) {
        onOverrideSuccess({
          ...email,
          classification: response.classification,
          updated_at: response.updated_at,
        });
      }
      onClose();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to override classification. Please try again.";
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Email Inspection &amp; Category Override
              </h3>
              <p className="text-xs text-slate-500">ID: {email.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Metadata Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900">Subject:</span>
              <span className="truncate">
                {email.subject || "(No subject)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900">Sender:</span>
              <span>{email.sender || "Unknown Sender"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900">Received:</span>
              <span>{new Date(email.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900">Source Type:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                {email.source_type}
                {email.file_name ? ` (${email.file_name})` : ""}
              </span>
            </div>
          </div>

          {/* AI Categorization Details */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 mb-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Original AI Classification</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Predicted Category:</span>
                <span className="font-bold text-slate-900">
                  {email.classification?.ai_category || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Confidence Score:</span>
                <span className="font-bold text-slate-900">
                  {email.classification?.confidence_score !== undefined
                    ? `${Number(email.classification.confidence_score).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
              {email.classification?.is_overridden && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800 border border-amber-300">
                  Overridden by User
                </span>
              )}
            </div>
          </div>

          {/* Email Body View */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Full Email Content
            </label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs text-slate-100 whitespace-pre-wrap">
              {email.body_text}
            </div>
          </div>

          {/* Category Override Selection */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Select New Category Tag:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const style = CATEGORY_STYLES[cat] || {
                    badge: "bg-slate-100 text-slate-800",
                    active: "bg-slate-800 text-white",
                  };
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-xs font-bold transition ${
                        isSelected
                          ? style.active + " shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label
                htmlFor="notes-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Reason / Feedback Note{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Contains promotional promo code or urgent SLA request"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Saving..." : "Confirm Override"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
