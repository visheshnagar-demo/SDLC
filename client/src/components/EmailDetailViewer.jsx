import React from "react";
import {
  ArrowLeft,
  Edit3,
  Calendar,
  FileText,
  CheckCircle,
  ShieldCheck,
  Tag,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";

export function EmailDetailViewer({ email, onOverrideClick, onBack }) {
  if (!email) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-semibold text-slate-700">No email selected</p>
      </div>
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoString;
    }
  };

  const confidencePct =
    email.confidence_score !== null && email.confidence_score !== undefined
      ? Math.round(email.confidence_score * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center space-x-1">
            <span>Dashboard</span>
            <span>/</span>
            <span>Emails</span>
            <span>/</span>
            <span className="font-mono text-slate-700">{email.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Email Detail & Manual Override
          </h1>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metadata & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Email Metadata</span>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {email.file_type ||
                  (email.file_name ? email.file_name.split(".").pop() : "text")}
              </span>
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Subject
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {email.subject || "(No Subject Provided)"}
                </p>
              </div>

              {email.file_name && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Source File
                  </span>
                  <p className="text-xs text-slate-700 font-mono mt-0.5 truncate">
                    {email.file_name}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Status
                  </span>
                  <span className="inline-flex items-center text-xs font-medium text-emerald-700 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    {email.status || "PROCESSED"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Ingested At
                  </span>
                  <span className="inline-flex items-center text-xs text-slate-600 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {formatDate(email.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Categorization & Override Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>Classification Details</span>
              </h2>
              {email.is_overridden && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-bold uppercase tracking-wider">
                  Manually Overridden
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Assigned Category
                </span>
                <CategoryBadge
                  category={email.category}
                  confidenceScore={email.confidence_score}
                  isOverridden={email.is_overridden}
                  size="lg"
                />
              </div>

              {confidencePct !== null && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">
                      AI Model Confidence Score
                    </span>
                    <span className="font-bold text-indigo-600">
                      {confidencePct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        confidencePct >= 80
                          ? "bg-emerald-500"
                          : confidencePct >= 50
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, confidencePct)}%` }}
                    />
                  </div>
                  {confidencePct < 50 && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Score below 50% threshold marked as Uncategorized.
                    </p>
                  )}
                </div>
              )}

              {email.original_category &&
                email.original_category !== email.category && (
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                    <span className="font-semibold text-slate-800 block">
                      Original AI Prediction:
                    </span>
                    <span className="text-slate-600 font-medium">
                      {email.original_category}
                    </span>
                  </div>
                )}

              <button
                onClick={onOverrideClick}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm shadow-indigo-200 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Override Category</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Email Content Viewer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Email Body Content</span>
              </span>
              <span className="text-xs text-slate-400">Sanitized Viewer</span>
            </h2>

            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {email.body || "(No body content found in email)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailDetailViewer;
