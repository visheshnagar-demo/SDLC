import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Calendar,
  Clock,
  AlertTriangle,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function WarrantyTimeline({
  product,
  warranty,
  onUpdateWarranty = () => {},
}) {
  if (!product) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
        Select a product to view warranty timeline details.
      </div>
    );
  }

  // Calculate timeline percentages & dates
  const purchaseDate = product.purchase_date
    ? new Date(product.purchase_date)
    : new Date();
  const durationMonths = warranty?.coverage_duration_months || 12;

  let expirationDate;
  if (warranty?.expiration_date) {
    expirationDate = new Date(warranty.expiration_date);
  } else {
    expirationDate = new Date(purchaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + durationMonths);
  }

  const now = new Date();
  const totalDays = Math.max(
    1,
    Math.round((expirationDate - purchaseDate) / (1000 * 60 * 60 * 24)),
  );
  const daysElapsed = Math.max(
    0,
    Math.round((now - purchaseDate) / (1000 * 60 * 60 * 24)),
  );
  const daysRemaining = Math.max(
    0,
    Math.round((expirationDate - now) / (1000 * 60 * 60 * 24)),
  );

  const percentageElapsed = Math.min(
    100,
    Math.max(0, Math.round((daysElapsed / totalDays) * 100)),
  );
  const percentageRemaining = 100 - percentageElapsed;

  const isExpired =
    now > expirationDate || warranty?.status?.toLowerCase() === "expired";
  const isExpiringSoon = !isExpired && daysRemaining <= 30;

  // 30-day alert milestone date
  const alertDate = new Date(expirationDate);
  alertDate.setDate(alertDate.getDate() - 30);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Coverage Overview
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {warranty?.provider_name || product.brand || "Manufacturer"}{" "}
            Warranty
          </h2>
        </div>
        <div>
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
              <ShieldX className="w-4 h-4 text-rose-600" />
              Coverage Expired
            </span>
          ) : isExpiringSoon ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Expiring in {daysRemaining} Days
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Active Warranty ({Math.round(daysRemaining / 30)} Months
              Remaining)
            </span>
          )}
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-600">
            {percentageRemaining}% Coverage Remaining
          </span>
          <span className="text-slate-500">{daysRemaining} days left</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExpired
                ? "bg-rose-500"
                : isExpiringSoon
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${Math.max(5, percentageRemaining)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>Start: {purchaseDate.toISOString().split("T")[0]}</span>
          <span className="text-amber-600 font-semibold">
            Alert: {alertDate.toISOString().split("T")[0]}
          </span>
          <span>Expires: {expirationDate.toISOString().split("T")[0]}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Calendar className="w-3.5 h-3.5" /> Start Date
          </div>
          <p className="text-sm font-bold text-slate-800">
            {product.purchase_date || "N/A"}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Clock className="w-3.5 h-3.5" /> Total Duration
          </div>
          <p className="text-sm font-bold text-slate-800">
            {durationMonths} Months
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Building2 className="w-3.5 h-3.5" /> Coverage Type
          </div>
          <p className="text-sm font-bold text-slate-800">
            {warranty?.coverage_type || "Comprehensive"}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Expiration Date
          </div>
          <p className="text-sm font-bold text-slate-800">
            {expirationDate.toISOString().split("T")[0]}
          </p>
        </div>
      </div>
    </div>
  );
}
