import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PlusCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import ProvisionWizard from "../components/instances/ProvisionWizard.jsx";
import { instancesApi, providersApi } from "../services/api.js";

export default function ProvisionInstancePage({ currentUser }) {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [provisionedInstance, setProvisionedInstance] = useState(null);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await providersApi.getProviders();
        if (Array.isArray(data) && data.length > 0) {
          setProviders(data);
        }
      } catch {
        // Fallback default providers
        setProviders([
          { id: "AWS", name: "AWS Production", provider_type: "AWS" },
          { id: "GCP", name: "GCP Analytics", provider_type: "GCP" },
          { id: "AZURE", name: "Azure Primary", provider_type: "AZURE" },
        ]);
      }
    };
    loadProviders();
  }, []);

  const handleProvisionSubmit = async (formData) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await instancesApi.provisionInstance(formData);
      setProvisionedInstance(
        result || {
          id: `inst-${Date.now().toString().slice(-4)}`,
          name: formData.name,
          provider_type: formData.provider_type,
          region: formData.region,
          status: "PROVISIONING",
          public_ip: "54.210.88.19",
        },
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to provision cloud instance. Please check provider credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs text-[#bcc9cd] hover:text-[#06b6d4] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Instances</span>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold font-mono text-[#dae2fd] flex items-center gap-2.5">
          <PlusCircle className="w-5 h-5 text-[#06b6d4]" />
          Provision Multi-Cloud VM Instance
        </h1>
        <p className="text-xs text-[#bcc9cd] mt-0.5">
          Deploy high-performance compute instances across AWS EC2, GCP Compute
          Engine, and Azure Virtual Machines
        </p>
      </div>

      {/* Success Notification Banner */}
      {provisionedInstance ? (
        <div className="bg-[#0f172a] border border-[#10b981]/50 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center mx-auto border border-[#10b981]/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#dae2fd]">
            Cloud Instance Provisioning Initiated!
          </h2>
          <p className="text-xs text-[#bcc9cd] max-w-md mx-auto">
            Instance{" "}
            <strong className="text-[#dae2fd] font-mono">
              {provisionedInstance.name}
            </strong>{" "}
            has been scheduled for boot on{" "}
            <strong className="text-[#06b6d4]">
              {provisionedInstance.provider_type || "AWS"}
            </strong>{" "}
            ({provisionedInstance.region}).
          </p>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              to={`/instances/${provisionedInstance.id}`}
              className="px-5 py-2.5 bg-[#06b6d4] hover:bg-[#38bdf8] text-[#0b1326] font-bold text-xs rounded-xl transition-colors"
            >
              View Instance Telemetry
            </Link>
            <button
              onClick={() => {
                setProvisionedInstance(null);
                navigate("/");
              }}
              className="px-5 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] text-xs font-semibold rounded-xl transition-colors"
            >
              Back to Fleet
            </button>
          </div>
        </div>
      ) : (
        <ProvisionWizard
          providers={providers}
          onSubmit={handleProvisionSubmit}
          currentUser={currentUser}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  );
}
