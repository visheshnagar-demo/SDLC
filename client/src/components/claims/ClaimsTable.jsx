import React from "react";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Edit3,
  Trash2,
} from "lucide-react";

export default function ClaimsTable({
  claims = [],
  products = [],
  loading = false,
  selectedStatus = "All",
  onSelectStatus = () => {},
  onOpenLogClaim = () => {},
  onUpdateClaimStatus = () => {},
}) {
  const statuses = ["All", "Pending", "In Progress", "Approved", "Resolved"];

  const getProductName = (productId) => {
    const prod = products.find((p) => p.id === productId);
    return prod ? `${prod.brand || ""} ${prod.name}` : "Product";
  };

  const filteredClaims = claims.filter((claim) => {
    if (selectedStatus === "All") return true;
    return claim.status?.toLowerCase() === selectedStatus.toLowerCase();
  });

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "pending";
    switch (s) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "in progress":
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-48"></div>
        <div className="h-48 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => onSelectStatus(status)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === status
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenLogClaim}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          + Log New Claim
        </button>
      </div>

      {filteredClaims.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No claims recorded
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {selectedStatus === "All"
              ? "You have not logged any warranty or repair claims yet."
              : `No claims currently with status "${selectedStatus}".`}
          </p>
          <button
            onClick={onOpenLogClaim}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
          >
            <Wrench className="w-4 h-4" />
            <span>Log First Claim</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="w-full text-left border-collapse"
              aria-label="Claims table"
            >
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Claim Ref / ID</th>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">Claim Date</th>
                  <th className="py-3.5 px-6">Issue & Service Center</th>
                  <th className="py-3.5 px-6">Repair Cost</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredClaims.map((claim, idx) => {
                  const claimRef = claim.id
                    ? `CLM-${claim.id.slice(0, 8).toUpperCase()}`
                    : `CLM-00${idx + 1}`;
                  return (
                    <tr
                      key={claim.id || idx}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-slate-800 text-xs">
                        {claimRef}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {getProductName(claim.product_id)}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        {claim.claim_date || "N/A"}
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">
                          {claim.issue_description}
                        </div>
                        {claim.service_center && (
                          <div className="text-xs text-slate-400 truncate">
                            📍 {claim.service_center}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        $
                        {typeof claim.repair_cost === "number"
                          ? claim.repair_cost.toFixed(2)
                          : claim.repair_cost || "0.00"}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <select
                          value={claim.status || "Pending"}
                          onChange={(e) =>
                            onUpdateClaimStatus(claim.id, e.target.value)
                          }
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Approved">Approved</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
