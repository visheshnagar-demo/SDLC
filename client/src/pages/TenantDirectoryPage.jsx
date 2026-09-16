import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Users,
  ShieldAlert,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { tenantApi } from "../services/api";
import TenantTable from "../components/tenants/TenantTable";

export default function TenantDirectoryPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tenantApi.getTenants({ skip: 0, limit: 100 });
      // Response can be paginated (items) or array
      const items = response.items || response || [];
      setTenants(items);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      setError(
        "Unable to load tenant directory from API. Check backend connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await tenantApi.updateTenantStatus(id, newStatus);
      fetchTenants();
    } catch (err) {
      console.error("Failed to update tenant status:", err);
      alert("Failed to update tenant status.");
    }
  };

  const handleDeleteTenant = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to soft-delete this tenant? Data is retained for 30 days.",
      )
    ) {
      return;
    }
    try {
      await tenantApi.deleteTenant(id);
      fetchTenants();
    } catch (err) {
      console.error("Failed to delete tenant:", err);
      alert("Failed to delete tenant.");
    }
  };

  // Calculate Metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (t) => (t.status || "").toUpperCase() === "ACTIVE",
  ).length;
  const activeRate =
    totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 100;
  const enterpriseCount = tenants.filter((t) =>
    (t.tier_name || t.tier?.display_name || "")
      .toLowerCase()
      .includes("enterprise"),
  ).length;
  const totalStorageGb = tenants.reduce(
    (acc, t) => acc + (t.storage_used_gb || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Directory Page Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Tenant Overview & Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central multi-tenant control plane for environment provisioning,
            domain routing, and quota enforcement.
          </p>
        </div>

        <Link
          to="/onboard"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Tenant</span>
        </Link>
      </div>

      {/* Metric Cards KPI Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tenants */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Total Registered Tenants
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalTenants}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              Multi-Tenant SaaS
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Active Tenant Rate
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {activeRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {activeTenants} active environments
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Enterprise Tiers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Enterprise Accounts
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {enterpriseCount}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">
              High-quota isolation
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Storage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Global Storage Consumption
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalStorageGb} GB
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across all tenant schemas
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Tenant Registry Table */}
      <TenantTable
        tenants={tenants}
        loading={loading}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onToggleStatus={handleToggleStatus}
        onDeleteTenant={handleDeleteTenant}
      />
    </div>
  );
}
