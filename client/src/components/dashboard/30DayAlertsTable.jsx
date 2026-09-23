import React from "react";
import { ShieldAlert, ArrowRight, Calendar, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ThirtyDayAlertsTable({ alerts = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded"></div>
          <div className="h-12 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Expiring in 30 Days
            </h2>
            <p className="text-xs text-slate-500">
              Warranties requiring renewal, inspection, or claim filing
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
          {alerts.length} Action Needed
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            No urgent expirations!
          </p>
          <p className="text-xs text-slate-500 mt-1">
            All your active warranties have more than 30 days of coverage
            remaining.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-left border-collapse"
            aria-label="30-day alerts table"
          >
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6">Product</th>
                <th className="py-3 px-6">Expiration Date</th>
                <th className="py-3 px-6">Days Remaining</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {alerts.map((alert, idx) => {
                const daysRemaining = alert.days_remaining ?? 0;
                const isUrgent = daysRemaining <= 10;
                return (
                  <tr
                    key={alert.product_id || alert.id || idx}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">
                        {alert.product_name || alert.name || "Product"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {alert.brand || alert.category || "General"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {alert.expiration_date || "N/A"}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isUrgent
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"}{" "}
                        left
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {alert.status || "Expiring Soon"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/warranties?product=${alert.product_id || alert.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
