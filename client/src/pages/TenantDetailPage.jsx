import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowLeft,
  Globe,
  Shield,
  Users,
  HardDrive,
  Ban,
  CheckCircle,
  Trash2,
  Mail,
  Calendar,
  Key,
  AlertTriangle,
} from "lucide-react";
import { tenantApi } from "../services/api";
import { StatusBadge, TierBadge } from "../components/tenants/TenantTable";
import QuotaEditor from "../components/tenants/QuotaEditor";
import CustomDomainsList from "../components/tenants/CustomDomainsList";
import AuditLogTimeline from "../components/tenants/AuditLogTimeline";

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState(null);
  const [usage, setUsage] = useState(null);
  const [domains, setDomains] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantApi.getTenantDetails(id);
      setTenant(data);

      // Fetch domain list & usage in parallel
      try {
        const doms = await tenantApi.getDomains(id);
        setDomains(doms || []);
      } catch (e) {
        console.warn("Could not fetch domains:", e);
      }

      try {
        const usg = await tenantApi.getTenantUsage(id);
        setUsage(usg);
      } catch (e) {
        console.warn("Could not fetch usage:", e);
      }
    } catch (err) {
      console.error("Failed to load tenant details:", err);
      setError("Tenant not found or failed to retrieve details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const logs = await tenantApi.getAuditLogs(id, { skip: 0, limit: 20 });
      setAuditLogs(logs.items || logs || []);
    } catch (e) {
      console.warn("Could not fetch audit logs:", e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTenantData();
      fetchLogs();
    }
  }, [id]);

  const handleToggleStatus = async (newStatus) => {
    try {
      await tenantApi.updateTenantStatus(id, newStatus);
      fetchTenantData();
      fetchLogs();
    } catch (err) {
      alert("Failed to update tenant status.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to soft-delete this tenant? Data is retained for 30 days.",
      )
    ) {
      return;
    }
    try {
      await tenantApi.deleteTenant(id);
      navigate("/");
    } catch (err) {
      alert("Failed to delete tenant.");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-medium">Loading tenant details...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Tenant Not Found</h2>
        <p className="text-xs text-slate-500">
          {error || "Requested tenant ID does not exist."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Directory</span>
        </Link>
      </div>
    );
  }

  const maxUsers =
    usage?.max_users ?? tenant.custom_max_users ?? tenant.tier?.max_users ?? 10;
  const maxStorageGb =
    usage?.max_storage_gb ??
    tenant.custom_max_storage_gb ??
    tenant.tier?.max_storage_gb ??
    5;
  const activeUsers = usage?.active_users ?? tenant.active_users_count ?? 1;
  const storageUsedGb = usage?.storage_used_gb ?? tenant.storage_used_gb ?? 0;

  const userUsagePct =
    usage?.usage_percentage_users ??
    Math.min(100, Math.round((activeUsers / maxUsers) * 100));
  const storageUsagePct =
    usage?.usage_percentage_storage ??
    Math.min(100, Math.round((storageUsedGb / maxStorageGb) * 100));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tenant Directory</span>
        </Link>
      </div>

      {/* Main Tenant Banner Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {tenant.name}
            </h1>
            <StatusBadge status={tenant.status} />
            <TierBadge
              tierName={
                tenant.tier_name || tenant.tier?.display_name || "Starter"
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 mt-2 font-mono">
            <span className="flex items-center space-x-1">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>ID: {tenant.tenant_id || tenant.id}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Slug: {tenant.slug}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin: {tenant.admin_email || "Not configured"}</span>
            </span>
          </div>
        </div>

        {/* Status Actions Bar */}
        <div className="flex items-center space-x-2 shrink-0">
          {tenant.status === "ACTIVE" ? (
            <button
              onClick={() => handleToggleStatus("SUSPENDED")}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Suspend Tenant</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus("ACTIVE")}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Reactivate Tenant</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Soft Delete</span>
          </button>
        </div>
      </div>

      {/* Quota Usage Gauge Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Quota Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Active User Seats Usage</span>
            </span>
            <span className="font-mono font-bold text-slate-700">
              {activeUsers} / {maxUsers} seats
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                userUsagePct > 90
                  ? "bg-rose-500"
                  : userUsagePct > 75
                    ? "bg-amber-500"
                    : "bg-indigo-600"
              }`}
              style={{ width: `${userUsagePct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Utilization: {userUsagePct}%</span>
            <span>Limit enforced by TenantService</span>
          </div>
        </div>

        {/* Storage Quota Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>Storage Quota Utilization</span>
            </span>
            <span className="font-mono font-bold text-slate-700">
              {storageUsedGb} GB / {maxStorageGb} GB
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                storageUsagePct > 90
                  ? "bg-rose-500"
                  : storageUsagePct > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${storageUsagePct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Utilization: {storageUsagePct}%</span>
            <span>Cloud SQL PostgreSQL Isolation</span>
          </div>
        </div>
      </div>

      {/* Grid Layout for Configuration & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Domains & Quota Editor */}
        <div className="lg:col-span-7 space-y-6">
          <CustomDomainsList
            tenantId={id}
            domains={domains}
            onDomainChange={fetchTenantData}
          />

          <QuotaEditor
            tenantId={id}
            currentSubscription={{
              tier_name: tenant.tier_name || tenant.tier?.display_name,
              max_users: maxUsers,
              max_storage_gb: maxStorageGb,
              custom_max_users: tenant.custom_max_users,
              custom_max_storage_gb: tenant.custom_max_storage_gb,
            }}
            onSubscriptionUpdated={fetchTenantData}
          />
        </div>

        {/* Right Column: Audit Timeline */}
        <div className="lg:col-span-5">
          <AuditLogTimeline logs={auditLogs} loading={logsLoading} />
        </div>
      </div>
    </div>
  );
}
