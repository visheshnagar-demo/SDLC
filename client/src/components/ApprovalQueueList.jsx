import React from "react";
import {
  Clock,
  User,
  Building,
  Calendar,
  ChevronRight,
  Inbox,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";

export default function ApprovalQueueList({
  visits = [],
  loading = false,
  error = "",
  selectedVisit = null,
  onSelectVisit,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">
          Loading pending approval queue...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">
            Failed to Load Approval Queue
          </h4>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Queue is Clear!
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          You currently have no pending visitor requests awaiting your decision.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((item) => {
        const isSelected = selectedVisit && selectedVisit.id === item.id;
        const visitor = item.visitor || {};
        const scheduled = item.scheduled_start_time
          ? new Date(item.scheduled_start_time).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Pending schedule";

        return (
          <div
            key={item.id}
            onClick={() => onSelectVisit && onSelectVisit(item)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {visitor.full_name ? (
                    visitor.full_name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {visitor.full_name || "Anonymous Visitor"}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3 mr-1 text-amber-500" />
                      Pending Review
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {visitor.company || "Independent"}
                    </span>
                    <span className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {visitor.email}
                    </span>
                    {visitor.phone && (
                      <span className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {visitor.phone}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-medium text-slate-700">
                      Purpose:{" "}
                    </span>
                    <span className="text-slate-600">{item.purpose}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between self-stretch pl-4">
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Arrival
                  </div>
                  <div className="text-xs font-semibold text-slate-700 flex items-center mt-0.5">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                    {scheduled}
                  </div>
                </div>

                <div className="mt-3">
                  <span className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    Review & Decide
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
