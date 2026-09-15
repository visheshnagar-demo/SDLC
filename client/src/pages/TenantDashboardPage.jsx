import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tenantApi, authApi } from "../services/api.js";
import TenantMetricsBar from "../components/tenants/TenantMetricsBar.jsx";
import TenantDirectoryTable from "../components/tenants/TenantDirectoryTable.jsx";
import TenantOnboardModal from "../components/tenants/TenantOnboardModal.jsx";
import { Plus, RefreshCw, LogIn, Shield, Building2 } from "lucide-react";

export default function TenantDashboardPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Login form state for quick authentication
  const [showLoginModal, setShowInviteModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("test@example.com");
  const [loginPassword, setLoginPassword] = useState("testpassword");
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access_token"),
  );
  const [authError, setAuthError] = useState(null);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantApi.listTenants({
        status: statusFilter || undefined,
      });
      setTenants(data.items || []);
      setTotal(data.total || (data.items ? data.items.length : 0));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to fetch tenant directory",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [statusFilter]);

  const handleOnboardSubmit = async (onboardData) => {
    await tenantApi.onboardTenant(onboardData);
    fetchTenants();
  };

  const handleStatusChange = async (tenantId, newStatus) => {
    await tenantApi.updateTenantStatus(tenantId, newStatus);
    fetchTenants();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await authApi.login(loginEmail, loginPassword);
      setIsLoggedIn(true);
      setShowInviteModal(false);
      fetchTenants();
    } catch (err) {
      setAuthError(
        err.response?.data?.detail ||
          "Authentication failed. Please check credentials.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1326] text-slate-100 p-6 md:p-10">
      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Tenant Control Plane
            </h1>
            <p className="text-xs text-slate-400">
              Enterprise Multi-Tenant Onboarding & Governance Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTenants}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {!isLoggedIn ? (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              Sign In (Test Account)
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Admin Authenticated
            </span>
          )}

          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Onboard Tenant
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner with Test Credentials Info */}
        <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-xl flex items-center justify-between gap-4 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>System Notice:</strong> Test account pre-configured:{" "}
              <code className="bg-indigo-900/60 px-1.5 py-0.5 rounded text-indigo-300 font-mono">
                test@example.com
              </code>{" "}
              /{" "}
              <code className="bg-indigo-900/60 px-1.5 py-0.5 rounded text-indigo-300 font-mono">
                testpassword
              </code>
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* High-level KPI Metrics */}
        <TenantMetricsBar tenants={tenants} total={total} />

        {/* Directory Table */}
        <TenantDirectoryTable
          tenants={tenants}
          loading={loading}
          onSelectTenant={(id) => navigate(`/tenants/${id}`)}
          onStatusChange={handleStatusChange}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* Onboard Modal */}
      <TenantOnboardModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSubmit={handleOnboardSubmit}
      />

      {/* Quick Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-1">Platform Admin Login</h3>
            <p className="text-xs text-slate-400 mb-4">
              Authenticates requests with platform JWT credentials
            </p>

            {authError && (
              <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
