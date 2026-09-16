import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { tenantApi } from "../../services/api";

export default function TenantOnboardingWizard({ onSuccess }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    custom_subdomain: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_email: "",
    tier_id: "",
    tier_name: "Starter",
  });

  useEffect(() => {
    async function loadTiers() {
      try {
        setLoadingTiers(true);
        const data = await tenantApi.getSubscriptionTiers();
        setTiers(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            tier_id: data[0].id,
            tier_name: data[0].display_name || data[0].name,
          }));
        }
      } catch (err) {
        console.error("Failed to load subscription tiers:", err);
      } finally {
        setLoadingTiers(false);
      }
    }
    loadTiers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from name if slug hasn't been manually tweaked
      if (
        name === "name" &&
        (!prev.slug ||
          prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]/g, "-"))
      ) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  const validateStep = (currentStep) => {
    setErrorMessage("");
    if (currentStep === 1) {
      if (!formData.name.trim()) return "Organization name is required.";
      if (!formData.slug.trim()) return "Tenant URL slug is required.";
      if (!/^[a-z0-9-]+$/.test(formData.slug))
        return "Slug can only contain lowercase letters, numbers, and hyphens.";
    } else if (currentStep === 2) {
      if (!formData.admin_email.trim())
        return "Primary administrator email is required.";
      if (!/\S+@\S+\.\S+/.test(formData.admin_email))
        return "Please enter a valid email address.";
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setErrorMessage("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep(step);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        tier_id: formData.tier_id || null,
        tier_name: formData.tier_name,
        admin_email: formData.admin_email,
        admin_first_name: formData.admin_first_name,
        admin_last_name: formData.admin_last_name,
        custom_subdomain:
          formData.custom_subdomain || `${formData.slug}.yourplatform.com`,
        settings: {
          feature_flags: {
            multi_domain: true,
            sso_enabled: formData.tier_name
              .toLowerCase()
              .includes("enterprise"),
          },
        },
      };

      const created = await tenantApi.createTenant(payload);
      if (onSuccess) {
        onSuccess(created);
      } else {
        navigate(`/tenants/${created.id || created.tenant_id}`);
      }
    } catch (err) {
      console.error("Failed to create tenant:", err);
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setErrorMessage(detail);
      } else if (Array.isArray(detail)) {
        setErrorMessage(detail.map((d) => d.msg).join(", "));
      } else {
        setErrorMessage(
          "Failed to onboard tenant. Please verify unique tenant name/slug and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Wizard Header / Steps Navigation */}
      <div className="bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold">Onboard New Tenant Environment</h2>
        <p className="text-xs text-slate-400 mt-1">
          Provision an isolated tenant instance, admin credentials, and
          subscription quotas.
        </p>

        {/* Steps Bar */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 1
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              1
            </div>
            <span
              className={`text-xs font-medium ${step >= 1 ? "text-white" : "text-slate-500"}`}
            >
              Business Metadata
            </span>
          </div>
          <div className="h-0.5 flex-1 mx-4 bg-slate-800">
            <div
              className={`h-full bg-indigo-600 transition-all ${step === 2 ? "w-1/2" : step === 3 ? "w-full" : "w-0"}`}
            />
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-medium ${step >= 2 ? "text-white" : "text-slate-500"}`}
            >
              Primary Administrator
            </span>
          </div>
          <div className="h-0.5 flex-1 mx-4 bg-slate-800">
            <div
              className={`h-full bg-indigo-600 transition-all ${step === 3 ? "w-full" : "w-0"}`}
            />
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 3
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-medium ${step >= 3 ? "text-white" : "text-slate-500"}`}
            >
              Subscription Tier
            </span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Business Metadata */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <Building2 className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">
                Organization Information
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization / Company Name{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenant URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="acme-corp"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <span className="px-3 py-2 text-xs bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-500 font-mono">
                  .yourplatform.com
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Unique tenant handle used for subdomains and context headers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Domain / Subdomain (Optional)
              </label>
              <input
                type="text"
                name="custom_subdomain"
                value={formData.custom_subdomain}
                onChange={handleChange}
                placeholder="e.g. acme.custombrand.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Primary Administrator */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <User className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">
                Tenant Administrator Profile
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="admin_first_name"
                  value={formData.admin_first_name}
                  onChange={handleChange}
                  placeholder="Jane"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="admin_last_name"
                  value={formData.admin_last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="admin_email"
                value={formData.admin_email}
                onChange={handleChange}
                placeholder="admin@acme.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                An activation link and primary login invitation will be sent to
                this email.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Subscription Tier */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">
                Select Subscription Tier
              </h3>
            </div>

            {loadingTiers ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading plan options...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(tiers.length > 0
                  ? tiers
                  : [
                      {
                        id: "starter-id",
                        display_name: "Starter",
                        max_users: 10,
                        max_storage_gb: 5,
                      },
                      {
                        id: "pro-id",
                        display_name: "Pro",
                        max_users: 100,
                        max_storage_gb: 50,
                      },
                      {
                        id: "enterprise-id",
                        display_name: "Enterprise",
                        max_users: 1000,
                        max_storage_gb: 500,
                      },
                    ]
                ).map((tier) => {
                  const isSelected =
                    formData.tier_id === tier.id ||
                    formData.tier_name === (tier.display_name || tier.name);
                  return (
                    <div
                      key={tier.id || tier.name}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          tier_id: tier.id,
                          tier_name: tier.display_name || tier.name,
                        }))
                      }
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-sm">
                          {tier.display_name || tier.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div>
                          Max Users:{" "}
                          <span className="font-semibold text-slate-900">
                            {tier.max_users}
                          </span>
                        </div>
                        <div>
                          Storage:{" "}
                          <span className="font-semibold text-slate-900">
                            {tier.max_storage_gb} GB
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Buttons Bar */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center space-x-1.5 transition-colors shadow-md"
            >
              {submitting ? "Provisioning Tenant..." : "Complete Provisioning"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
