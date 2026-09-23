import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import ClaimsTable from "../components/claims/ClaimsTable.jsx";
import LogClaimDrawer from "../components/claims/LogClaimDrawer.jsx";

export default function ClaimsManagementPage({
  claims = [],
  products = [],
  warranties = [],
  loading = false,
  onLogClaim = async () => {},
  onUpdateClaimStatus = async () => {},
}) {
  const [searchParams] = useSearchParams();
  const productParam = searchParams.get("product");

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(Boolean(productParam));
  const [defaultProductId, setDefaultProductId] = useState(productParam || "");

  useEffect(() => {
    if (productParam) {
      setDefaultProductId(productParam);
      setIsLogDrawerOpen(true);
    }
  }, [productParam]);

  const totalCost = claims.reduce(
    (sum, c) => sum + (parseFloat(c.repair_cost) || 0),
    0,
  );
  const resolvedCount = claims.filter(
    (c) => c.status?.toLowerCase() === "resolved",
  ).length;
  const pendingCount = claims.filter(
    (c) => c.status?.toLowerCase() === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Repair & Claim History ({claims.length})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain complete audit trails of warranty claims, service centers,
            parts replacements, and repair costs.
          </p>
        </div>

        <button
          onClick={() => {
            setDefaultProductId(products.length > 0 ? products[0].id : "");
            setIsLogDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Claim</span>
        </button>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Claims
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {claims.length}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Resolved Repairs
            </span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
              {resolvedCount}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Repair Spend
            </span>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">
              ${totalCost.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      <ClaimsTable
        claims={claims}
        products={products}
        loading={loading}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onOpenLogClaim={() => setIsLogDrawerOpen(true)}
        onUpdateClaimStatus={onUpdateClaimStatus}
      />

      <LogClaimDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        products={products}
        warranties={warranties}
        defaultProductId={defaultProductId}
        onSubmit={onLogClaim}
      />
    </div>
  );
}
