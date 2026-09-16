import React, { useState } from "react";
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { tenantApi } from "../../services/api";

export default function CustomDomainsList({
  tenantId,
  domains = [],
  onDomainChange,
}) {
  const [newDomain, setNewDomain] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [adding, setAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setAdding(true);
    setErrorMessage("");

    try {
      await tenantApi.addDomain(tenantId, {
        domain_name: newDomain.trim(),
        is_primary: isPrimary,
      });
      setNewDomain("");
      setIsPrimary(false);
      if (onDomainChange) onDomainChange();
    } catch (err) {
      console.error("Failed to add custom domain:", err);
      const detail = err.response?.data?.detail;
      setErrorMessage(
        typeof detail === "string" ? detail : "Failed to register domain.",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDomain = async (domainId) => {
    try {
      await tenantApi.deleteDomain(tenantId, domainId);
      if (onDomainChange) onDomainChange();
    } catch (err) {
      console.error("Failed to delete domain:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Globe className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-sm">
            Mapped Custom Hostnames
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
          {domains.length} Mapped
        </span>
      </div>

      {errorMessage && (
        <div className="p-2.5 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Domain Registration Form */}
      <form
        onSubmit={handleAddDomain}
        className="mb-6 flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="e.g. app.customer.com"
          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <label className="flex items-center space-x-1.5 text-xs text-slate-600 px-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span>Primary</span>
        </label>
        <button
          type="submit"
          disabled={adding || !newDomain.trim()}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{adding ? "Mapping..." : "Add Domain"}</span>
        </button>
      </form>

      {/* Domain List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-2 px-3">Hostname</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Verification</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  No custom hostnames mapped yet.
                </td>
              </tr>
            ) : (
              domains.map((dom) => (
                <tr
                  key={dom.id || dom.domain_name}
                  className="hover:bg-slate-50"
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                    {dom.domain_name}
                  </td>
                  <td className="py-2.5 px-3">
                    {dom.is_primary ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                        Primary
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">
                        Secondary
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {dom.is_verified ? (
                      <span className="inline-flex items-center text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-amber-600 font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Pending CNAME
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteDomain(dom.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Unmap domain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
