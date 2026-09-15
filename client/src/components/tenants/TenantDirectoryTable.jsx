import React, { useState } from "react";
import {
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  MoreVertical,
} from "lucide-react";

export default function TenantDirectoryTable({
  tenants = [],
  loading = false,
  onSelectTenant,
  onStatusChange,
  statusFilter = "",
  setStatusFilter,
  searchQuery = "",
  setSearchQuery,
}) {
  const [updatingId, setUpdatingId] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
            Active
          </span>
        );
      case "Suspended":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
            Suspended
          </span>
        );
      case "Deactivated":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
            Deactivated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.domain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusSelect = async (e, tenantId) => {
    const newStatus = e.target.value;
    if (!newStatus) return;
    setUpdatingId(tenantId);
    try {
      await onStatusChange(tenantId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenants by name, slug, domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-medium">
              <th className="py-3.5 px-4">Organization</th>
              <th className="py-3.5 px-4">Slug / Identifier</th>
              <th className="py-3.5 px-4">Domain</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created At</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-2 align-middle"></div>
                  Loading directory...
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  No tenants found.
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-100">
                    <button
                      onClick={() => onSelectTenant(tenant.id)}
                      className="text-left hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                    >
                      {tenant.name}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs px-2 py-1 bg-slate-800 rounded text-indigo-300 border border-slate-700">
                      {tenant.slug}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {tenant.domain ? (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        {tenant.domain}
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(tenant.status)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        disabled={updatingId === tenant.id}
                        defaultValue=""
                        onChange={(e) => handleStatusSelect(e, tenant.id)}
                        className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="" disabled>
                          Set Status
                        </option>
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Deactivated">Deactivated</option>
                      </select>
                      <button
                        onClick={() => onSelectTenant(tenant.id)}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
                      >
                        Details
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
