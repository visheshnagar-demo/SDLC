import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getTenantDetail,
  updateTenant,
  updateTenantStatus,
} from "../services/api";
import { QuotaTelemetryMeters } from "../components/tenants/QuotaTelemetryMeters";
import { TenantOnboardingForm } from "../components/tenants/TenantOnboardingForm";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import {
  ArrowLeft,
  Settings,
  ShieldAlert,
  CheckCircle,
  Archive,
  Edit3,
  Building,
  Mail,
} from "lucide-react";

export const TenantDetailPage = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(
    searchParams.get("edit") === "true",
  );
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchTenant = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTenantDetail(tenantId);
      setTenant(data);
    } catch (err) {
      console.error("Failed to load tenant details:", err);
      setError(err.message || "Tenant not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  const handleUpdate = async (updatedPayload) => {
    setLoading(true);
    try {
      await updateTenant(tenantId, updatedPayload);
      setIsEditing(false);
      fetchTenant();
    } catch (err) {
      setError(err.message || "Failed to update tenant");
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await updateTenantStatus(
        tenantId,
        newStatus,
        `Admin transitioned status to ${newStatus}`,
      );
      fetchTenant();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading && !tenant) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
        <p>Loading tenant details...</p>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
        <h2 className="text-lg font-bold">Error</h2>
        <p className="mt-1 text-sm">{error}</p>
        <Button onClick={() => navigate("/")} className="mt-4" size="sm">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
      </button>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
            <Badge variant={tenant.status}>{tenant.status}</Badge>
            <Badge variant={tenant.tier}>{tenant.tier}</Badge>
          </div>
          <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2 font-mono">
            <span className="flex items-center">
              <Building className="w-3.5 h-3.5 mr-1 text-slate-400" /> slug:{" "}
              {tenant.slug}
            </span>
            <span className="flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />{" "}
              {tenant.admin_email}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/tenants/${tenant.id}/config`)}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Branding & SSO
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="w-4 h-4 mr-1.5" />
            {isEditing ? "Cancel Edit" : "Edit Quotas"}
          </Button>

          {tenant.status === "Active" && (
            <Button
              variant="warning"
              size="sm"
              isLoading={statusLoading}
              onClick={() => handleStatusChange("Suspended")}
            >
              <ShieldAlert className="w-4 h-4 mr-1.5" /> Suspend
            </Button>
          )}

          {tenant.status === "Suspended" && (
            <Button
              variant="primary"
              size="sm"
              isLoading={statusLoading}
              onClick={() => handleStatusChange("Active")}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" /> Activate
            </Button>
          )}

          {tenant.status !== "Archived" && (
            <Button
              variant="danger"
              size="sm"
              isLoading={statusLoading}
              onClick={() => handleStatusChange("Archived")}
            >
              <Archive className="w-4 h-4 mr-1.5" /> Archive
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <TenantOnboardingForm
          initialValues={tenant}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isLoading={loading}
          error={error}
        />
      ) : (
        <>
          {/* Telemetry and Resource Quotas */}
          <QuotaTelemetryMeters tenant={tenant} />

          {/* Configuration Preview Card */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                Configuration Summary
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/tenants/${tenant.id}/config`)}
              >
                Configure Settings →
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-500 block">
                  Custom Domain:
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {tenant.configuration?.custom_domain || "Not Configured"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-500 block">
                  Theme Color:
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{
                      backgroundColor:
                        tenant.configuration?.primary_theme_color || "#4F46E5",
                    }}
                  ></div>
                  <span className="font-mono font-medium text-slate-800">
                    {tenant.configuration?.primary_theme_color || "#4F46E5"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TenantDetailPage;
