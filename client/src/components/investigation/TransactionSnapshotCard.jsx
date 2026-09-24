import React from "react";
import { CreditCard, MapPin, Clock, DollarSign, Building } from "lucide-react";

export default function TransactionSnapshotCard({
  transaction = {},
  alert = {},
}) {
  const amountFormatted =
    transaction.amount !== undefined
      ? `$${Number(transaction.amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${transaction.currency || "USD"}`
      : "N/A";

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-blue-700" />
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Transaction Snapshot
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          ID: {transaction.id || "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Account ID
          </p>
          <p className="font-mono font-semibold text-slate-900 text-sm">
            {transaction.account_id || alert.account_id || "ACC-UNKNOWN"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            Transaction Amount
          </p>
          <p className="font-semibold text-red-600 text-base">
            {amountFormatted}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Location &amp; Coordinates
          </p>
          <p className="text-slate-800 font-medium text-xs">
            {transaction.location_name || "Unknown Location"}
            {transaction.latitude !== undefined &&
              transaction.longitude !== undefined && (
                <span className="block font-mono text-[11px] text-slate-500 mt-0.5">
                  ({transaction.latitude.toFixed(4)},{" "}
                  {transaction.longitude.toFixed(4)})
                </span>
              )}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Timestamp
          </p>
          <p className="font-mono text-slate-800 text-xs">
            {transaction.timestamp
              ? new Date(transaction.timestamp).toUTCString()
              : "N/A"}
          </p>
        </div>

        {transaction.merchant && (
          <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500">
              Merchant / Counterparty
            </p>
            <p className="text-slate-800 font-medium text-sm">
              {transaction.merchant}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
