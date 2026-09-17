import React from "react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import {
  Eye,
  Edit3,
  ShieldAlert,
  CheckCircle,
  Archive,
  Settings,
} from "lucide-react";

export const TenantDashboardTable = ({
  tenants = [],
  loading = false,
  onView,
  onEdit,
  onStatusChange,
  onManageConfig,
}) => {
  const tenantList = Array.isArray(tenants) ? tenants : tenants?.items || [];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
        <p>Loading tenants...</p>
      </div>
    );
  }

  if (tenantList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        <p className="text-base font-medium text-slate-700 mb-1">
          No Tenants Found
        </p>
        <p className="text-sm">
          No tenant organizations match your current search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Organization / Slug</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Tier</th>
              <th className="px-6 py-3.5">Admin Email</th>
              <th className="px-6 py-3.5">Quotas (Users / Storage / RPM)</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tenantList.map((tenant) => (
              <tr
                key={tenant.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">
                    {tenant.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    slug: {tenant.slug}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={tenant.status}>{tenant.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={tenant.tier}>{tenant.tier}</Badge>
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {tenant.admin_email}
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-600">
                  <div>
                    Seats:{" "}
                    <span className="font-semibold text-slate-900">
                      {tenant.max_users}
                    </span>
                  </div>
                  <div>
                    Storage:{" "}
                    <span className="font-semibold text-slate-900">
                      {tenant.storage_limit_gb} GB
                    </span>
                  </div>
                  <div>
                    Limit:{" "}
                    <span className="font-semibold text-slate-900">
                      {tenant.rate_limit_rpm} RPM
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView && onView(tenant)}
                      title="View Tenant Details"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManageConfig && onManageConfig(tenant)}
                      title="Branding & SSO Config"
                    >
                      <Settings className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit && onEdit(tenant)}
                      title="Edit Quotas"
                    >
                      <Edit3 className="w-4 h-4 text-slate-600" />
                    </Button>
                    {tenant.status === "Active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onStatusChange &&
                          onStatusChange(tenant.id, "Suspended")
                        }
                        title="Suspend Tenant"
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </Button>
                    )}
                    {tenant.status === "Suspended" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onStatusChange && onStatusChange(tenant.id, "Active")
                        }
                        title="Activate Tenant"
                        className="text-emerald-600 hover:text-emerald-800"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {tenant.status !== "Archived" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onStatusChange &&
                          onStatusChange(tenant.id, "Archived")
                        }
                        title="Archive Tenant"
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantDashboardTable;
