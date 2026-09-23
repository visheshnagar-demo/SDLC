import React, { useState, useEffect } from "react";
import {
  Package,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import ThirtyDayAlertsTable from "../components/dashboard/30DayAlertsTable.jsx";
import api from "../services/api.js";

export default function DashboardPage({
  products = [],
  warranties = [],
  claims = [],
  alerts = [],
  loading = false,
  onOpenRegisterModal = () => {},
}) {
  const activeWarrantiesCount = warranties.filter(
    (w) =>
      w.status?.toLowerCase() === "active" ||
      !w.status ||
      w.status?.toLowerCase() !== "expired",
  ).length;

  const totalClaimCosts = claims.reduce(
    (acc, c) => acc + (parseFloat(c.repair_cost) || 0),
    0,
  );

  const kpis = [
    {
      label: "Registered Products",
      value: products.length,
      icon: Package,
      color: "indigo",
      badge: `${products.length} Items`,
    },
    {
      label: "Active Warranties",
      value: activeWarrantiesCount,
      icon: ShieldCheck,
      color: "emerald",
      badge: "Protected",
    },
    {
      label: "Expiring in 30 Days",
      value: alerts.length,
      icon: ShieldAlert,
      color: "amber",
      badge: "Action Needed",
    },
    {
      label: "Total Claim Costs",
      value: `$${totalClaimCosts.toFixed(2)}`,
      icon: DollarSign,
      color: "purple",
      badge: `${claims.length} Claims`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
            Warranty Vault
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 text-white">
            Personal Warranty Dashboard
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Keep track of all your product guarantees, invoices, upcoming
            expiration dates, and repair claim history in one central vault.
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Register New Product</span>
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div
                  className={`p-2.5 rounded-xl ${
                    kpi.color === "emerald"
                      ? "bg-emerald-50 text-emerald-600"
                      : kpi.color === "amber"
                        ? "bg-amber-50 text-amber-600"
                        : kpi.color === "purple"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      kpi.color === "emerald"
                        ? "bg-emerald-100 text-emerald-800"
                        : kpi.color === "amber"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {kpi.badge}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 30-Day Alert Milestones */}
      <ThirtyDayAlertsTable alerts={alerts} loading={loading} />

      {/* Recent Registered Products Preview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recently Registered Products
            </h2>
            <p className="text-xs text-slate-500">Quick view of your catalog</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>View All ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">
              No products registered yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {p.category || "Product"}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">
                    {p.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {p.brand} • SN: {p.serial_number}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">
                    ${p.purchase_price || "0.00"}
                  </span>
                  <Link
                    to={`/warranties?product=${p.id}`}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
