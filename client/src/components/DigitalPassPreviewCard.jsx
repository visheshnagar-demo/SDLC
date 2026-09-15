import React from "react";
import {
  QrCode,
  ShieldCheck,
  Building,
  User,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  FileText,
} from "lucide-react";

export default function DigitalPassPreviewCard({
  formData = {},
  hostName = "",
}) {
  const visitorName = formData.full_name || "Guest Visitor";
  const company = formData.company || "Visiting Organization";
  const purpose = formData.purpose || "Business Collaboration";
  const scheduledTime = formData.scheduled_start_time
    ? new Date(formData.scheduled_start_time).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not Scheduled";

  return (
    <div className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/50 relative overflow-hidden flex flex-col justify-between">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Pass Header */}
        <div className="flex items-center justify-between border-b border-indigo-800/60 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">
              PassVault Digital Pass
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Preview Pass
          </span>
        </div>

        {/* Visitor Identity Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">
                Visitor Badge
              </div>
              <div className="text-xl font-bold text-white mt-0.5 break-words">
                {visitorName}
              </div>
              <div className="text-xs text-slate-300 flex items-center mt-1">
                <Building className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                {company}
              </div>
            </div>

            {/* Mock QR Code Card */}
            <div className="w-16 h-16 bg-white rounded-lg p-1 shadow-inner flex flex-col items-center justify-center flex-shrink-0">
              <QrCode className="w-12 h-12 text-slate-900" />
              <span className="text-[7px] text-slate-500 font-mono font-bold">
                PRE-PASS
              </span>
            </div>
          </div>
        </div>

        {/* Visit Details Grid */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg">
            <span className="text-slate-400 flex items-center">
              <User className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Host:
            </span>
            <span className="font-semibold text-white truncate max-w-[180px]">
              {hostName || "Assigned Staff"}
            </span>
          </div>

          <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg">
            <span className="text-slate-400 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Arrival:
            </span>
            <span className="font-semibold text-white">{scheduledTime}</span>
          </div>

          <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg">
            <span className="text-slate-400 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Purpose:
            </span>
            <span className="font-semibold text-white truncate max-w-[180px]">
              {purpose}
            </span>
          </div>
        </div>
      </div>

      {/* Security Pre-Clearance Checklist */}
      <div className="mt-6 pt-4 border-t border-indigo-800/60">
        <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
          Building Entry Checklist
        </div>
        <ul className="space-y-1.5 text-xs text-slate-300">
          <li className="flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400 flex-shrink-0" />
            <span>Host notification sent on submission</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400 flex-shrink-0" />
            <span>Pass code active upon host approval</span>
          </li>
          <li className="flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-400 flex-shrink-0" />
            <span>Government Photo ID required at reception</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
