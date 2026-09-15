import React from "react";
import {
  User,
  Building,
  Key,
  LogIn,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Inbox,
  CreditCard,
} from "lucide-react";

export default function LiveVisitorRosterTable({
  visits = [],
  loading = false,
  error = "",
  onSelectVisit,
  onCheckOut,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">
          Loading reception visitor roster...
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
            Failed to Load Visitor Roster
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
          No Matching Visitors Found
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Try adjusting your search criteria or pass code query above.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-blue-500" />
            Approved
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
            <LogIn className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            On-Premises
          </span>
        );
      case "CHECKED_OUT":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <LogOut className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Checked Out
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Pending Approval
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Visitor & Company</th>
              <th className="py-3.5 px-4">Pass Code / Badge</th>
              <th className="py-3.5 px-4">Host Employee</th>
              <th className="py-3.5 px-4">Schedule / Arrival</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Desk Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {visits.map((visit) => {
              const visitor = visit.visitor || {};
              const host = visit.host || {};
              const scheduledTime = visit.scheduled_start_time
                ? new Date(visit.scheduled_start_time).toLocaleString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )
                : "—";

              return (
                <tr
                  key={visit.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Visitor details */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {visitor.full_name ? (
                          visitor.full_name.charAt(0).toUpperCase()
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {visitor.full_name || "Guest"}
                        </div>
                        <div className="text-slate-500 flex items-center mt-0.5 text-[11px]">
                          <Building className="w-3 h-3 mr-1 text-slate-400" />
                          {visitor.company || "Independent"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pass code & Badge */}
                  <td className="py-3.5 px-4">
                    {visit.pass_code ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                          <Key className="w-3 h-3 mr-1 text-indigo-500" />
                          {visit.pass_code}
                        </span>
                        {visit.badge_id && (
                          <div className="text-[11px] text-slate-500 flex items-center font-medium">
                            <CreditCard className="w-3 h-3 mr-1 text-slate-400" />
                            Badge: #{visit.badge_id}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        No pass issued
                      </span>
                    )}
                  </td>

                  {/* Host */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">
                      {host.full_name || "—"}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {host.department || host.email || ""}
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {scheduledTime}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(visit.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    {visit.status === "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => onSelectVisit && onSelectVisit(visit)}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5 mr-1.5" />
                        Verify & Check In
                      </button>
                    )}

                    {visit.status === "CHECKED_IN" && (
                      <button
                        type="button"
                        onClick={() => onCheckOut && onCheckOut(visit)}
                        className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1.5" />
                        Check Out
                      </button>
                    )}

                    {visit.status !== "APPROVED" &&
                      visit.status !== "CHECKED_IN" && (
                        <button
                          type="button"
                          onClick={() => onSelectVisit && onSelectVisit(visit)}
                          className="inline-flex items-center px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          View Details
                        </button>
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
