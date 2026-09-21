import React, { useState } from "react";
import { Plus, Search, Container, AlertCircle } from "lucide-react";

export function TankTable({ tanks = [], onRegisterTank, onSelectTank }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    total_capacity_liters: 10000,
    current_volume_liters: 5000,
    net_flow_rate_lpm: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const filteredTanks = tanks.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (onRegisterTank) {
        await onRegisterTank({
          ...formData,
          total_capacity_liters: Number(formData.total_capacity_liters),
          current_volume_liters: Number(formData.current_volume_liters),
          net_flow_rate_lpm: Number(formData.net_flow_rate_lpm),
        });
      }
      setShowModal(false);
      setFormData({
        name: "",
        location: "",
        total_capacity_liters: 10000,
        current_volume_liters: 5000,
        net_flow_rate_lpm: 0,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to register tank");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tanks by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Tank</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 sm:px-6">Tank Name & Location</th>
              <th className="py-3 px-4 sm:px-6">Capacity</th>
              <th className="py-3 px-4 sm:px-6">Current Volume</th>
              <th className="py-3 px-4 sm:px-6">Capacity %</th>
              <th className="py-3 px-4 sm:px-6">Net Flow Rate</th>
              <th className="py-3 px-4 sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredTanks.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500">
                  No tanks found matching your search.
                </td>
              </tr>
            ) : (
              filteredTanks.map((tank) => {
                const fillPct = Math.round(
                  (tank.current_volume_liters / tank.total_capacity_liters) *
                    100,
                );
                return (
                  <tr
                    key={tank.id}
                    onClick={() => onSelectTank && onSelectTank(tank)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 sm:px-6 font-medium text-white">
                      <div className="flex items-center space-x-3">
                        <Container className="w-5 h-5 text-sky-400" />
                        <div>
                          <p className="font-bold text-white">{tank.name}</p>
                          <p className="text-xs text-slate-400">
                            {tank.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono">
                      {tank.total_capacity_liters.toLocaleString()} L
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono font-semibold text-white">
                      {tank.current_volume_liters.toLocaleString()} L
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              fillPct >= 98
                                ? "bg-rose-500"
                                : fillPct <= 10
                                  ? "bg-amber-500"
                                  : "bg-sky-500"
                            }`}
                            style={{ width: `${Math.min(100, fillPct)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {fillPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono text-xs">
                      <span
                        className={
                          tank.net_flow_rate_lpm >= 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {tank.net_flow_rate_lpm >= 0
                          ? `+${tank.net_flow_rate_lpm}`
                          : tank.net_flow_rate_lpm}{" "}
                        L/min
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          fillPct >= 98
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : fillPct <= 10
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {fillPct >= 98
                          ? "OVERFLOW"
                          : fillPct <= 10
                            ? "LOW LEVEL"
                            : "OPTIMAL"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Register Tank Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl text-slate-200">
            <h3 className="text-lg font-bold text-white mb-4">
              Register Storage Tank
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tank Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Storage Tank D"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Courtyard"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Capacity (Liters)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={formData.total_capacity_liters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_capacity_liters: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Volume (Liters)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.current_volume_liters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_volume_liters: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Register Tank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TankTable;
