import React from "react";
import PropTypes from "prop-types";
import { DollarSign, ShieldCheck, CheckCircle2, Layers } from "lucide-react";

export default function KPIHeaderStrip({ kpis, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm animate-pulse h-28"
          >
            <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatSales = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "--";
    return `$${Number(val).toFixed(2)}`;
  };

  const formatPct = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "--";
    return `${Number(val).toFixed(1)}%`;
  };

  const isShelfOverCapacity = kpis && kpis.shelf_capacity_utilization_pct > 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Sales / Linear Ft */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sales / Linear Ft
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatSales(kpis?.sales_per_linear_ft)}
          </div>
        </div>
        <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
          <span>+8.4% vs prev cycle</span>
        </div>
      </div>

      {/* KPI 2: Private Brand Share */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Private Brand Share
            </span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatPct(kpis?.private_brand_share_pct)}
          </div>
        </div>
        <div className="text-xs font-medium mt-2">
          {kpis && kpis.private_brand_share_pct >= 25.0 ? (
            <span className="text-emerald-600 font-semibold">
              Target: ≥25.0% (PASS)
            </span>
          ) : (
            <span className="text-amber-600 font-semibold">
              Target: ≥25.0% (BELOW TARGET)
            </span>
          )}
        </div>
      </div>

      {/* KPI 3: In-Stock Rate */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In-Stock Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatPct(kpis?.in_stock_rate_pct)}
          </div>
        </div>
        <div className="text-xs font-medium mt-2">
          {kpis && kpis.in_stock_rate_pct >= 95.0 ? (
            <span className="text-emerald-600 font-semibold">
              Target: ≥95.0% (Optimal)
            </span>
          ) : (
            <span className="text-amber-600 font-semibold">
              Target: ≥95.0% (Monitor)
            </span>
          )}
        </div>
      </div>

      {/* KPI 4: Shelf Capacity Utilization */}
      <div
        className={`p-4 rounded-lg border shadow-sm flex flex-col justify-between transition-colors ${
          isShelfOverCapacity
            ? "bg-amber-50 border-amber-300"
            : "bg-white border-slate-200"
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Shelf Capacity Utilization
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              isShelfOverCapacity ? "text-amber-900" : "text-slate-900"
            }`}
          >
            {formatPct(kpis?.shelf_capacity_utilization_pct)}
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium mt-2">
          {isShelfOverCapacity ? (
            <span className="text-amber-700 font-bold">
              ⚠️ Warning: Exceeds 100% capacity
            </span>
          ) : (
            <span>98.4 Linear Ft Assigned</span>
          )}
        </div>
      </div>

      {error && (
        <div className="col-span-full bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

KPIHeaderStrip.propTypes = {
  kpis: PropTypes.shape({
    sales_per_linear_ft: PropTypes.number,
    private_brand_share_pct: PropTypes.number,
    in_stock_rate_pct: PropTypes.number,
    shelf_capacity_utilization_pct: PropTypes.number,
    cluster_name: PropTypes.string,
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
};
