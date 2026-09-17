import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTenants, updateTenantStatus } from "../services/api";
import { TenantDashboardTable } from "../components/tenants/TenantDashboardTable";
import { Button } from "../components/common/Button";
import {
  Plus,
  Search,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Users,
} from "lucide-react";

export const TenantDashboardPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [error, setError] = useState(null);

  const fetchTenantsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (tierFilter) params.tier = tierFilter;

      const data = await getTenants(params);
      const items = Array.isArray(data) ? data : data?.items || [];
      setTenants(items);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      setError(err.message || "Failed to load tenant list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantsList();
  }, [statusFilter, tierFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTenantsList();
  };

  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await updateTenantStatus(
        tenantId,
        newStatus,
        `Admin transitioned status to ${newStatus}`,
      );
      fetchTenantsList();
    } catch (err) {
      alert(`Error updating tenant status: ${err.message}`);
    }
  };

  // Metric stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "Active").length;
  const suspendedTenants = tenants.filter(
    (t) => t.status === "Suspended",
  ).length;
  const totalAllocatedSeats = tenants.reduce(
    (acc, t) => acc + (t.max_users || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Multi-Tenant Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision client organizations, manage subscription tiers, enforce
            quotas, and control tenant status.
          </p>
        </div>
        <Button onClick={() => navigate("/onboard")} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Onboard New Tenant
        </Button>
      </div>

      {/* KPI Stats Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Tenants
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalTenants}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Organizations
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {activeTenants}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Suspended
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {suspendedTenants}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Allocated Seats
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalAllocatedSeats.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center space-x-2 w-full md:w-96"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, slug, or admin email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Tiers</option>
            <option value="Free">Free</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Main Tenant Table */}
      <TenantDashboardTable
        tenants={tenants}
        loading={loading}
        onView={(t) => navigate(`/tenants/${t.id}`)}
        onEdit={(t) => navigate(`/tenants/${t.id}?edit=true`)}
        onManageConfig={(t) => navigate(`/tenants/${t.id}/config`)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default TenantDashboardPage;
