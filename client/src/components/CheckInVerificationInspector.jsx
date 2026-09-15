import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Key,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck,
} from "lucide-react";
import { checkinService } from "../services/api";

export default function CheckInVerificationInspector({
  visit,
  onClose,
  onCheckInComplete,
}) {
  const [badgeId, setBadgeId] = useState("");
  const [idVerified, setIdVerified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!visit) return null;

  const visitor = visit.visitor || {};
  const host = visit.host || {};

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const updatedVisit = await checkinService.checkIn(
        visit.id,
        badgeId.trim() || null,
      );
      if (onCheckInComplete) {
        onCheckInComplete(updatedVisit);
      }
    } catch (err) {
      setError(err.message || "Failed to check in visitor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Check-In Verification</h3>
              <p className="text-xs text-slate-300">
                Front Desk Arrival Clearance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCheckInSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Check-in Failed: </span>
                {error}
              </div>
            </div>
          )}

          {/* Visitor Credentials Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {visitor.full_name ? (
                    visitor.full_name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {visitor.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {visitor.company || "Independent"}
                  </div>
                </div>
              </div>

              {visit.pass_code && (
                <span className="font-mono font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                  {visit.pass_code}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Host
                </span>
                <span className="font-semibold text-slate-800">
                  {host.full_name || "Staff"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Contact
                </span>
                <span className="font-semibold text-slate-800">
                  {visitor.phone || visitor.email}
                </span>
              </div>
              <div className="col-span-2 pt-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Purpose
                </span>
                <span className="text-slate-700 font-medium">
                  {visit.purpose}
                </span>
              </div>
            </div>
          </div>

          {/* Hardware Badge Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hardware Physical Badge ID (Optional)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                placeholder="e.g. BDG-084 or RFID #..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Scan or enter the physical guest badge card number assigned.
            </span>
          </div>

          {/* Identity Verification Checkbox */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={idVerified}
                onChange={(e) => setIdVerified(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-emerald-900">
                Physical Government Photo ID Verified at Front Desk
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !idVerified}
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {loading ? "Processing..." : "Confirm Arrival & Check In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
