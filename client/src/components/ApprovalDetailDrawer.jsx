import React, { useState } from "react";
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { approvalService } from "../services/api";

export default function ApprovalDetailDrawer({
  visit,
  onClose,
  onActionComplete,
}) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!visit) return null;

  const visitor = visit.visitor || {};
  const scheduled = visit.scheduled_start_time
    ? new Date(visit.scheduled_start_time).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not Scheduled";

  const handleAction = async (actionType) => {
    setError("");
    setSubmitting(true);
    try {
      const updatedVisit = await approvalService.processAction(visit.id, {
        action: actionType,
        approval_notes: notes.trim() || null,
      });
      if (onActionComplete) {
        onActionComplete(updatedVisit, actionType);
      }
    } catch (err) {
      setError(err.message || `Failed to ${actionType.toLowerCase()} request.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">
              Visitor Request Review
            </h3>
            <span className="text-xs text-slate-300 font-mono">
              REF: {visit.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6 flex-1">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Action Failed: </span>
              {error}
            </div>
          </div>
        )}

        {/* Visitor Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {visitor.full_name ? (
                visitor.full_name.charAt(0).toUpperCase()
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                {visitor.full_name}
              </h4>
              <p className="text-xs text-slate-500 flex items-center mt-0.5">
                <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {visitor.company || "Independent Visitor"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 py-1">
              <span className="flex items-center text-slate-500">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Email:
              </span>
              <span className="font-semibold text-slate-800">
                {visitor.email}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1">
              <span className="flex items-center text-slate-500">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Phone:
              </span>
              <span className="font-semibold text-slate-800">
                {visitor.phone || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1">
              <span className="flex items-center text-slate-500">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Requested Time:
              </span>
              <span className="font-semibold text-slate-800">{scheduled}</span>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Visit Purpose
          </label>
          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-slate-800 text-sm font-medium">
            {visit.purpose}
          </div>
        </div>

        {/* Host Notes Field */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Host Decision Notes (Optional)
          </label>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Escort required at lobby, or pass approved for 2nd floor lab..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="text-[11px] text-slate-400 block mt-1">
            Notes will be included in the audit log and visitor pass
            instructions.
          </span>
        </div>
      </div>

      {/* Decision CTA Buttons */}
      <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleAction("REJECT")}
          className="w-full py-2.5 px-4 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold rounded-xl text-sm flex items-center justify-center shadow-sm transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4 mr-2 text-rose-600" />
          Reject Request
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => handleAction("APPROVE")}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center shadow-sm shadow-emerald-200 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve Pass
        </button>
      </div>
    </div>
  );
}
