import React from "react";
import { UserCheck, UserX, Wrench, Clock, CheckCircle } from "lucide-react";

const OperationalFeed = ({
  pendingCheckIns = [],
  pendingCheckOuts = [],
  maintenanceAlerts = [],
  onActionClick,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Front Desk Queue & Alerts
          </h3>
          <p className="text-xs text-slate-500">
            Live operational priorities for today
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
          Live Feed
        </span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Pending Check-ins */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              Impending Check-Ins ({pendingCheckIns.length})
            </span>
          </div>

          {pendingCheckIns.length === 0 ? (
            <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg text-center">
              No pending check-ins for today.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingCheckIns.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {item.guest_name || item.guest?.full_name || "Guest"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Room {item.room_number || item.room?.room_number || "TBD"}{" "}
                      • {item.total_nights || 1} Night(s)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onActionClick && onActionClick("checkin", item)
                    }
                    className="px-2.5 py-1 bg-blue-600 text-white rounded font-medium text-[11px] hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Check-outs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <UserX className="h-3.5 w-3.5 text-amber-600" />
              Pending Check-Outs ({pendingCheckOuts.length})
            </span>
          </div>

          {pendingCheckOuts.length === 0 ? (
            <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg text-center">
              No pending check-outs for today.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingCheckOuts.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {item.guest_name || item.guest?.full_name || "Guest"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Room {item.room_number || item.room?.room_number || "TBD"}{" "}
                      • Folio Pending
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onActionClick && onActionClick("checkout", item)
                    }
                    className="px-2.5 py-1 bg-amber-600 text-white rounded font-medium text-[11px] hover:bg-amber-700 shadow-sm transition-colors"
                  >
                    Check Out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Housekeeping / Maintenance Alerts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Wrench className="h-3.5 w-3.5 text-rose-600" />
              Maintenance & Housekeeping
            </span>
          </div>
          {maintenanceAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
              <CheckCircle className="h-4 w-4" />
              <span>All rooms inspected and operational</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {maintenanceAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs text-rose-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold">Room {alert.room_number}</span>:{" "}
                    {alert.issue || "Under maintenance"}
                  </div>
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-semibold">
                    In Progress
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationalFeed;
