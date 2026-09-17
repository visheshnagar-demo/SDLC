import React, { useState } from "react";
import { Button } from "../common/Button";

export const TenantOnboardingForm = ({
  initialValues = null,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const isEditing = Boolean(initialValues?.id);

  const [formData, setFormData] = useState({
    name: initialValues?.name || "",
    slug: initialValues?.slug || "",
    tier: initialValues?.tier || "Pro",
    admin_email: initialValues?.admin_email || "",
    max_users: initialValues?.max_users || 50,
    storage_limit_gb: initialValues?.storage_limit_gb || 100,
    rate_limit_rpm: initialValues?.rate_limit_rpm || 1000,
  });

  const tierPresets = {
    Free: { max_users: 10, storage_limit_gb: 5, rate_limit_rpm: 100 },
    Pro: { max_users: 50, storage_limit_gb: 100, rate_limit_rpm: 1000 },
    Enterprise: {
      max_users: 500,
      storage_limit_gb: 1000,
      rate_limit_rpm: 5000,
    },
  };

  const handleTierChange = (tier) => {
    const preset = tierPresets[tier] || tierPresets.Free;
    setFormData((prev) => ({
      ...prev,
      tier,
      max_users: preset.max_users,
      storage_limit_gb: preset.storage_limit_gb,
      rate_limit_rpm: preset.rate_limit_rpm,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
      };

      // Auto-generate slug from organization name if creating new tenant and slug wasn't manually customized
      if (
        name === "name" &&
        !isEditing &&
        (!prev.slug ||
          prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]/g, "-"))
      ) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {isEditing
            ? "Edit Tenant Organization & Quotas"
            : "Onboard New Tenant Organization"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isEditing
            ? "Update subscription tier and allocated resource quotas."
            : "Register a new client organization, assign primary administrator, and configure resource limits."}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Organization Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Acme Corporation"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Tenant Slug (Unique ID) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="slug"
            required
            disabled={isEditing}
            value={formData.slug}
            onChange={handleChange}
            placeholder="e.g. acme-corp"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-100 disabled:text-slate-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Globally unique identifier used for subdomains and multi-tenant
            routing.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Primary Administrator Email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            name="admin_email"
            required
            value={formData.admin_email}
            onChange={handleChange}
            placeholder="e.g. admin@acme.com"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Subscription Tier
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["Free", "Pro", "Enterprise"].map((tier) => (
            <div
              key={tier}
              onClick={() => handleTierChange(tier)}
              className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${
                formData.tier === tier
                  ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="font-bold text-slate-900">{tier}</div>
              <div className="text-xs text-slate-500 mt-1">
                {tier === "Free" && "10 Seats • 5 GB Storage"}
                {tier === "Pro" && "50 Seats • 100 GB Storage"}
                {tier === "Enterprise" && "500 Seats • 1000 GB Storage"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-base font-semibold text-slate-800 mb-4">
          Resource Limits & Quotas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              User Seats Quota
            </label>
            <input
              type="number"
              name="max_users"
              min="1"
              required
              value={formData.max_users}
              onChange={handleChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Storage Allocation (GB)
            </label>
            <input
              type="number"
              name="storage_limit_gb"
              min="1"
              required
              value={formData.storage_limit_gb}
              onChange={handleChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              API Rate Limit (RPM)
            </label>
            <input
              type="number"
              name="rate_limit_rpm"
              min="10"
              required
              value={formData.rate_limit_rpm}
              onChange={handleChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? "Save Changes" : "Create Organization"}
        </Button>
      </div>
    </form>
  );
};

export default TenantOnboardingForm;
