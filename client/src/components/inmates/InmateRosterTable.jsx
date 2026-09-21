import React, { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  ShieldAlert,
  HeartPulse,
  RefreshCw,
} from "lucide-react";
import { getInmates } from "../../services/api";

export function InmateRosterTable({ onSelectInmate, userRole = "ADMIN" }) {
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [securityFilter, setSecurityFilter] = useState("");
  const [medicalFilter, setMedicalFilter] = useState(false);

  const fetchInmatesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInmates({
        search,
        security_tier: securityFilter || undefined,
      });
      setInmates(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to fetch inmate roster",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmatesList();
  }, [securityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInmatesList();
  };

  const filteredInmates = inmates.filter((inmate) => {
    if (medicalFilter) {
      return inmate.medical_alerts && inmate.medical_alerts.length > 0;
    }
    return true;
  });

  const getTierBadge = (tier) => {
    switch (tier) {
      case "HIGH_SECURITY":
      case "MAXIMUM":
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
            {tier}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
            {tier}
          </span>
        );
      case "MINIMUM":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            {tier || "MINIMUM"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">
              Total Inmates
            </p>
            <p className="text-2xl font-bold font-mono text-cyan-400">
              {inmates.length}
            </p>
          </div>
          <ShieldAlert className="w-8 h-8 text-cyan-500/40" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">
              High Security
            </p>
            <p className="text-2xl font-bold font-mono text-rose-400">
              {
                inmates.filter(
                  (i) =>
                    i.security_tier === "HIGH_SECURITY" ||
                    i.security_tier === "MAXIMUM",
                ).length
              }
            </p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500/40" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">
              Medical Alerts
            </p>
            <p className="text-2xl font-bold font-mono text-amber-400">
              {
                inmates.filter(
                  (i) => i.medical_alerts && i.medical_alerts.length > 0,
                ).length
              }
            </p>
          </div>
          <HeartPulse className="w-8 h-8 text-amber-500/40" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">
              Cell Assigned
            </p>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {inmates.filter((i) => i.cell_id).length}
            </p>
          </div>
          <span className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono text-emerald-400 text-xs font-bold">
            CELL
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search Inmate ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 text-xs font-mono text-slate-200 pl-9 pr-3 py-2 rounded border border-slate-800 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-semibold rounded border border-slate-700"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={securityFilter}
            onChange={(e) => setSecurityFilter(e.target.value)}
            className="bg-slate-950 text-xs font-mono text-slate-300 border border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
            aria-label="Filter by Security Tier"
          >
            <option value="">All Security Tiers</option>
            <option value="MINIMUM">Minimum Security</option>
            <option value="MEDIUM">Medium Security</option>
            <option value="MAXIMUM">Maximum Security</option>
            <option value="HIGH_SECURITY">High Security</option>
          </select>

          <button
            type="button"
            onClick={() => setMedicalFilter(!medicalFilter)}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded border transition-colors flex items-center gap-1.5 ${
              medicalFilter
                ? "bg-amber-950 text-amber-400 border-amber-800"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Medical Tagged Only
          </button>

          <button
            type="button"
            onClick={fetchInmatesList}
            className="p-2 bg-slate-950 text-slate-400 hover:text-cyan-400 rounded border border-slate-800"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Inmate ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">DOB</th>
                <th className="p-3">Security Tier</th>
                <th className="p-3">Assigned Cell</th>
                <th className="p-3">Medical Alerts</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    Loading inmate roster data...
                  </td>
                </tr>
              ) : filteredInmates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No inmate records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInmates.map((inmate) => (
                  <tr
                    key={inmate.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-bold text-cyan-400">
                      {inmate.inmate_number || inmate.id?.slice(0, 8)}
                    </td>
                    <td className="p-3 font-semibold">
                      {inmate.first_name} {inmate.last_name}
                    </td>
                    <td className="p-3 text-slate-400">
                      {inmate.date_of_birth || "N/A"}
                    </td>
                    <td className="p-3">
                      {getTierBadge(inmate.security_tier)}
                    </td>
                    <td className="p-3">
                      {inmate.cell_id ? (
                        <span className="text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {inmate.cell_id}
                        </span>
                      ) : (
                        <span className="text-rose-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      {inmate.medical_alerts &&
                      inmate.medical_alerts.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {inmate.medical_alerts.map((alert, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 text-[10px] bg-amber-950 text-amber-300 rounded border border-amber-800"
                            >
                              {typeof alert === "string"
                                ? alert
                                : alert.tag || alert.alert}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600">None</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectInmate && onSelectInmate(inmate)}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 rounded border border-cyan-800 text-[11px] font-semibold"
                      >
                        Details / Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InmateRosterTable;
