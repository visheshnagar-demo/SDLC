import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tenantApi } from "../services/api.js";
import QuotaConfigCard from "../components/tenants/QuotaConfigCard.jsx";
import UserRbacTable from "../components/tenants/UserRbacTable.jsx";
import AuditLogViewer from "../components/tenants/AuditLogViewer.jsx";
import {
  ArrowLeft,
  Building2,
  Globe,
  Shield,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState(null);
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("config"); // 'config' | 'users' | 'audit'

  const fetchTenantAllDetails = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      const [tenantData, configData, usersData, auditData] = await Promise.all([
        tenantApi.getTenantDetails(tenantId),
        tenantApi.getTenantConfig(tenantId).catch(() => null),
        tenantApi.listTenantUsers(tenantId).catch(() => ({ items: [] })),
        tenantApi.getTenantAuditLogs(tenantId).catch(() => ({ items: [] })),
      ]);

      setTenant(tenantData);
      setConfig(configData);
      setUsers(usersData?.items || []);
      setAuditLogs(auditData?.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load tenant details",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantAllDetails();
  }, [tenantId]);

  const handleSaveConfig = async (newConfig) => {
    const updated = await tenantApi.updateTenantConfig(tenantId, newConfig);
    setConfig(updated);
  };

  const handleInviteUser = async (userData) => {
    await tenantApi.inviteTenantUser(tenantId, userData);
    const usersRes = await tenantApi.listTenantUsers(tenantId);
    setUsers(usersRes.items || []);
  };

  const handleRevokeUser = async (userId) => {
    await tenantApi.revokeTenantUser(tenantId, userId);
    const usersRes = await tenantApi.listTenantUsers(tenantId);
    setUsers(usersRes.items || []);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus) return;
    try {
      const updated = await tenantApi.updateTenantStatus(tenantId, newStatus);
      setTenant(updated);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update tenant status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1326] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="text-sm text-slate-400">
            Loading tenant profile & configurations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1326] text-slate-100 p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold">Error Loading Tenant</h2>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1326] text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation back button */}
        <div>
          <button
            onClick={() => navigate("/")}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            Back to Directory Dashboard
          </button>
        </div>

        {/* Tenant Summary Header Card */}
        {tenant && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-100">
                      {tenant.name}
                    </h1>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300">
                      {tenant.slug}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      {tenant.domain || "No custom domain"}
                    </span>
                    <span>•</span>
                    <span>
                      ID:{" "}
                      <code className="font-mono text-slate-300">
                        {tenant.id}
                      </code>
                    </span>
                    <span>•</span>
                    <span>
                      Created:{" "}
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Control */}
              <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-medium text-slate-400">
                  Tenant Status:
                </span>
                <select
                  value={tenant.status}
                  onChange={handleStatusChange}
                  className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setActiveTab("config")}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "config"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                Quotas & Config
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "users"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                Users & RBAC ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "audit"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                Audit Trail ({auditLogs.length})
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "config" && (
          <QuotaConfigCard
            tenantId={tenantId}
            config={config}
            onSave={handleSaveConfig}
          />
        )}

        {activeTab === "users" && (
          <UserRbacTable
            tenantId={tenantId}
            users={users}
            onInviteUser={handleInviteUser}
            onRevokeUser={handleRevokeUser}
          />
        )}

        {activeTab === "audit" && <AuditLogViewer auditLogs={auditLogs} />}
      </div>
    </div>
  );
}
