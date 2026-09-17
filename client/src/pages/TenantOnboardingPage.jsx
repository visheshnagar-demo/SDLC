import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTenant } from "../services/api";
import { TenantOnboardingForm } from "../components/tenants/TenantOnboardingForm";
import { ArrowLeft } from "lucide-react";

export const TenantOnboardingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateTenant = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createTenant(payload);
      navigate(`/tenants/${created.id}`);
    } catch (err) {
      console.error("Failed to create tenant:", err);
      setError(err.message || "Failed to onboard new tenant organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
      </button>

      <TenantOnboardingForm
        onSubmit={handleCreateTenant}
        onCancel={() => navigate("/")}
        isLoading={loading}
        error={error}
      />
    </div>
  );
};

export default TenantOnboardingPage;
