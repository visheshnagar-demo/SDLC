import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { Globe, Palette, Key, Check, AlertCircle } from "lucide-react";

export const TenantConfigPanel = ({
  tenant,
  config = null,
  onSave,
  isLoading = false,
  message = null,
  error = null,
}) => {
  const [form, setForm] = useState({
    custom_domain: config?.custom_domain || "",
    logo_url: config?.logo_url || "",
    primary_theme_color: config?.primary_theme_color || "#4F46E5",
    saml_sso_config: config?.saml_sso_config || "",
  });

  useEffect(() => {
    if (config) {
      setForm({
        custom_domain: config.custom_domain || "",
        logo_url: config.logo_url || "",
        primary_theme_color: config.primary_theme_color || "#4F46E5",
        saml_sso_config: config.saml_sso_config || "",
      });
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(form);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-slate-900">
          Branding, Custom Domain & SAML SSO
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Configure custom domain mapping, portal branding logo and colors, and
          SAML 2.0 Single Sign-On parameters for{" "}
          {tenant?.name || "this organization"}.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800 flex items-center font-medium">
          <Check className="w-4 h-4 mr-2 text-emerald-600" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-800 flex items-center font-medium">
          <AlertCircle className="w-4 h-4 mr-2 text-rose-600" />
          {error}
        </div>
      )}

      {/* Custom Domain Section */}
      <div className="space-y-4 pt-2 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h4 className="text-base font-semibold text-slate-800">
            Custom Domain & CNAME Mapping
          </h4>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Custom Hostname / Domain
          </label>
          <input
            type="text"
            name="custom_domain"
            value={form.custom_domain}
            onChange={handleChange}
            placeholder="portal.acme.com"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">
            Point your domain's CNAME record to{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">
              ingress.platform.com
            </code>
          </p>
        </div>
      </div>

      {/* Branding Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-indigo-600" />
          <h4 className="text-base font-semibold text-slate-800">
            Branding & Theme Customization
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo Image URL
            </label>
            <input
              type="url"
              name="logo_url"
              value={form.logo_url}
              onChange={handleChange}
              placeholder="https://assets.acme.com/logo.png"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Theme Color
            </label>
            <div className="flex space-x-3 items-center">
              <input
                type="color"
                name="primary_theme_color"
                value={form.primary_theme_color}
                onChange={handleChange}
                className="h-9 w-12 border border-slate-300 rounded cursor-pointer p-0.5"
              />
              <input
                type="text"
                name="primary_theme_color"
                value={form.primary_theme_color}
                onChange={handleChange}
                placeholder="#4F46E5"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SAML SSO Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-indigo-600" />
          <h4 className="text-base font-semibold text-slate-800">
            SAML 2.0 Single Sign-On (SSO)
          </h4>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Identity Provider (IdP) Metadata XML / Config
          </label>
          <textarea
            name="saml_sso_config"
            rows="4"
            value={form.saml_sso_config}
            onChange={handleChange}
            placeholder='{"entity_id": "https://idp.acme.com/metadata", "sso_url": "https://idp.acme.com/sso"}'
            className="w-full px-3.5 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
          ></textarea>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          Save Configuration
        </Button>
      </div>
    </form>
  );
};

export default TenantConfigPanel;
