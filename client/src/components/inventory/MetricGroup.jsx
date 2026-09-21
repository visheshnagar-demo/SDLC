import React from "react";
import { Package, AlertTriangle, Building2, Layers } from "lucide-react";

export default function MetricGroup({ metrics = {} }) {
  const {
    totalItems = 0,
    lowStockCount = 0,
    totalQuantity = 0,
    activeWarehouses = 0,
  } = metrics;

  const cards = [
    {
      title: "Total Catalog Items",
      value: totalItems,
      icon: Package,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount,
      icon: AlertTriangle,
      color: "bg-amber-500",
      textColor: lowStockCount > 0 ? "text-amber-600" : "text-slate-600",
      bgColor: lowStockCount > 0 ? "bg-amber-50" : "bg-slate-50",
      badge: lowStockCount > 0 ? "Attention Needed" : "Healthy",
    },
    {
      title: "Total Stock Units",
      value: totalQuantity.toLocaleString(),
      icon: Layers,
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Active Warehouses",
      value: activeWarehouses,
      icon: Building2,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {card.value}
              </span>
              {card.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    lowStockCount > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
