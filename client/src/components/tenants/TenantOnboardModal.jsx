import React, { useState } from "react";
import {
  X,
  Building2,
  UserCheck,
  Lock,
  AlertCircle,
  Check,
} from "lucide-react";

export default function TenantOnboardModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    admin_email: "",
    admin_full_name: "",
    admin_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from name if user hasn't explicitly edited slug
      if (name === "name" && !prev.slugEdited) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      if (name === "slug") {
        updated.slugEdited = true;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit({
        name: formData.name,
        slug: formData.slug,
        domain: formData.domain || null,
        admin_email: formData.admin_email,
        admin_full_name: formData.admin_full_name,
        admin_password: formData.admin_password,
      });
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to onboard tenant";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Onboard New Tenant
              </h2>
              <p className="text-xs text-slate-400">
                Provision isolated organization and administrator account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2.5 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Organization Metadata */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                1. Organization Details
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tenant / Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tenant Slug / ID *
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="acme-corp"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm font-mono text-indigo-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Unique slug used in URL path & headers
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Domain (Optional)
                </label>
                <input
                  type="text"
                  name="domain"
                  placeholder="acme.com"
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Right Column: Initial Admin Account */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                2. Root Administrator
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  name="admin_full_name"
                  required
                  placeholder="Jane Doe"
                  value={formData.admin_full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  name="admin_email"
                  required
                  placeholder="admin@acme.com"
                  value={formData.admin_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  name="admin_password"
                  required
                  placeholder="••••••••••••"
                  value={formData.admin_password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Provisioning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Onboard Tenant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
