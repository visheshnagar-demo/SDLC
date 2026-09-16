import React from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Globe,
  Users,
  HardDrive,
} from "lucide-react";

export function StatusBadge({ status }) {
  const normalized = (status || "").toUpperCase();
  if (normalized === "ACTIVE") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
        ACTIVE
      </span>
    );
  } else if (normalized === "SUSPENDED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
        SUSPENDED
      </span>
    );
  } else if (normalized === "CANCELLED" || normalized === "SOFT_DELETED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
        {normalized}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      {status || "UNKNOWN"}
    </span>
  );
}

export function TierBadge({ tierName }) {
  const name = (tierName || "Starter").toLowerCase();
  if (name.includes("enterprise")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        Enterprise
      </span>
    );
  } else if (name.includes("pro")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      Starter
    </span>
  );
}

export default function TenantTable({
  tenants = [],
  loading = false,
  statusFilter = "ALL",
  onStatusFilterChange,
  searchQuery = "",
  onSearchQueryChange,
  onToggleStatus,
  onDeleteTenant,
}) {
  const filteredTenants = tenants.filter((tenant) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (tenant.status && tenant.status.toUpperCase() === statusFilter);
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      (tenant.name && tenant.name.toLowerCase().includes(query)) ||
      (tenant.slug && tenant.slug.toLowerCase().includes(query)) ||
      (tenant.tenant_id && tenant.tenant_id.toLowerCase().includes(query)) ||
      (tenant.primary_domain &&
        tenant.primary_domain.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Filters Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/60 p-1 rounded-lg w-full sm:w-auto">
          {["ALL", "ACTIVE", "SUSPENDED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => onStatusFilterChange && onStatusFilterChange(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === tab
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "ALL" ? "All Tenants" : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              onSearchQueryChange && onSearchQueryChange(e.target.value)
            }
            placeholder="Filter by name, slug, domain..."
            className="w-full pl-3 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Organization & Tenant ID</th>
              <th className="py-3 px-4">Domain / Slug</th>
              <th className="py-3 px-4">Subscription Tier</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Resource Usage</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mb-2"></div>
                  <p>Loading tenant directory...</p>
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <p className="font-medium text-slate-700">No tenants found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try updating your filters or onboard a new tenant.
                  </p>
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id || tenant.tenant_id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Organization & ID */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {tenant.name}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                      {tenant.tenant_id || tenant.id}
                    </div>
                  </td>

                  {/* Domain / Slug */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1 text-slate-700 font-medium">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {tenant.primary_domain ||
                          `${tenant.slug}.yourplatform.com`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      slug: {tenant.slug}
                    </div>
                  </td>

                  {/* Subscription Tier */}
                  <td className="py-3.5 px-4">
                    <TierBadge
                      tierName={
                        tenant.tier_name ||
                        tenant.tier?.display_name ||
                        "Starter"
                      }
                    />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={tenant.status} />
                  </td>

                  {/* Usage */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1 w-32">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {tenant.active_users_count || 1} users
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-400" />
                          {tenant.storage_used_gb || 0} GB
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Created */}
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {tenant.created_at
                      ? new Date(tenant.created_at).toLocaleDateString()
                      : "Recently"}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/tenants/${tenant.id || tenant.tenant_id}`}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {tenant.status === "ACTIVE" ? (
                        <button
                          onClick={() =>
                            onToggleStatus &&
                            onToggleStatus(
                              tenant.id || tenant.tenant_id,
                              "SUSPENDED",
                            )
                          }
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Suspend Tenant"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            onToggleStatus &&
                            onToggleStatus(
                              tenant.id || tenant.tenant_id,
                              "ACTIVE",
                            )
                          }
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Reactivate Tenant"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          onDeleteTenant &&
                          onDeleteTenant(tenant.id || tenant.tenant_id)
                        }
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Tenant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
