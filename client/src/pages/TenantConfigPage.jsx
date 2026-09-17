import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTenantDetail, updateTenantConfig } from "../services/api";
import { TenantConfigPanel } from "../components/tenants/TenantConfigPanel";
import { ArrowLeft } from "lucide-react";

export const TenantConfigPage = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenantData = async () => {
      setLoading(true);
      try {
        const data = await getTenantDetail(tenantId);
        setTenant(data);
      } catch (err) {
        console.error("Failed to load tenant:", err);
        setError(err.message || "Tenant not found");
      } finally {
        setLoading(false);
      }
    };
    fetchTenantData();
  }, [tenantId]);

  const handleSaveConfig = async (configPayload) => {
    setSaveLoading(true);
    setMessage(null);
    setError(null);
    try {
      await updateTenantConfig(tenantId, configPayload);
      setMessage("Configuration updated successfully!");
      // Refresh details
      const refreshed = await getTenantDetail(tenantId);
      setTenant(refreshed);
    } catch (err) {
      console.error("Failed to save configuration:", err);
      setError(err.message || "Failed to save configuration");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
        <p>Loading tenant configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(`/tenants/${tenantId}`)}
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Tenant Details
      </button>

      <TenantConfigPanel
        tenant={tenant}
        config={tenant?.configuration}
        onSave={handleSaveConfig}
        isLoading={saveLoading}
        message={message}
        error={error}
      />
    </div>
  );
};

export default TenantConfigPage;
