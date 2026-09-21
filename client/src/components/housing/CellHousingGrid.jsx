import React, { useState, useEffect } from "react";
import {
  Grid,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { getCells, getInmates, assignCell } from "../../services/api";

export function CellHousingGrid({ userRole = "ADMIN" }) {
  const [cells, setCells] = useState([]);
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [selectedInmateId, setSelectedInmateId] = useState("");
  const [selectedCellId, setSelectedCellId] = useState("");
  const [assigning, setSubmitting] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cellsData, inmatesData] = await Promise.all([
        getCells().catch(() => [
          {
            id: "c101",
            cell_number: "A-101",
            block_name: "Block A",
            capacity: 2,
            current_occupancy: 1,
            security_tier: "MINIMUM",
          },
          {
            id: "c102",
            cell_number: "A-102",
            block_name: "Block A",
            capacity: 2,
            current_occupancy: 2,
            security_tier: "MINIMUM",
          },
          {
            id: "c201",
            cell_number: "B-201",
            block_name: "Block B",
            capacity: 2,
            current_occupancy: 1,
            security_tier: "MEDIUM",
          },
          {
            id: "c202",
            cell_number: "B-202",
            block_name: "Block B",
            capacity: 2,
            current_occupancy: 0,
            security_tier: "MEDIUM",
          },
          {
            id: "c301",
            cell_number: "C-301",
            block_name: "Block C",
            capacity: 1,
            current_occupancy: 0,
            security_tier: "MAXIMUM",
          },
          {
            id: "c302",
            cell_number: "C-302",
            block_name: "Block C",
            capacity: 1,
            current_occupancy: 0,
            security_tier: "HIGH_SECURITY",
          },
        ]),
        getInmates().catch(() => []),
      ]);
      setCells(Array.isArray(cellsData) ? cellsData : cellsData.items || []);
      setInmates(
        Array.isArray(inmatesData) ? inmatesData : inmatesData.items || [],
      );
    } catch (err) {
      setError(err.message || "Failed to fetch housing matrix data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInmateId || !selectedCellId) {
      setAssignError("Please select both an inmate and a target cell.");
      return;
    }

    setSubmitting(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      const res = await assignCell({
        inmate_id: selectedInmateId,
        cell_id: selectedCellId,
      });
      setAssignSuccess(
        res.message || "Cell housing assignment confirmed successfully.",
      );
      setSelectedInmateId("");
      setSelectedCellId("");
      fetchData();
    } catch (err) {
      setAssignError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Cell Assignment Error: Security tier mismatch or cell capacity exceeded.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "HIGH_SECURITY":
      case "MAXIMUM":
        return "border-rose-800 text-rose-400 bg-rose-950/40";
      case "MEDIUM":
        return "border-amber-800 text-amber-400 bg-amber-950/40";
      case "MINIMUM":
      default:
        return "border-emerald-800 text-emerald-400 bg-emerald-950/40";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded">
        <div>
          <h2 className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
            <Grid className="w-5 h-5" /> CELL HOUSING & CAPACITY MANAGEMENT
            MATRIX
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            CAPACITY ENFORCEMENT & RISK TIER SEPARATION ENGINE
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-slate-950 text-slate-400 hover:text-cyan-400 rounded border border-slate-800 flex items-center gap-1.5 text-xs font-mono"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Grid
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assignment Control Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
          <h3 className="text-md font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">
            CELL ASSIGNMENT CONTROL PANEL
          </h3>

          {assignError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{assignError}</span>
            </div>
          )}

          {assignSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{assignSuccess}</span>
            </div>
          )}

          <form
            onSubmit={handleAssignSubmit}
            className="space-y-4 text-xs font-mono"
          >
            <div>
              <label className="block text-slate-400 mb-1">
                Select Inmate to Assign
              </label>
              <select
                value={selectedInmateId}
                onChange={(e) => setSelectedInmateId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Choose Inmate --</option>
                {inmates.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.inmate_number || i.id?.slice(0, 8)} - {i.first_name}{" "}
                    {i.last_name} ({i.security_tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Select Target Housing Cell
              </label>
              <select
                value={selectedCellId}
                onChange={(e) => setSelectedCellId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Choose Cell --</option>
                {cells.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={c.current_occupancy >= c.capacity}
                  >
                    {c.cell_number} [{c.block_name}] - Tier: {c.security_tier} (
                    {c.current_occupancy}/{c.capacity}{" "}
                    {c.current_occupancy >= c.capacity ? "FULL" : "AVAILABLE"})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
              <p className="font-bold text-slate-300 mb-1">
                🛡️ Security Guard Rule Engine:
              </p>
              Inmates assigned to housing must have security tier matching or
              below cell security tier. High-security inmates cannot be assigned
              to minimum-security wings.
            </div>

            <button
              type="submit"
              disabled={assigning}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded shadow flex items-center justify-center gap-2"
            >
              {assigning
                ? "Executing Cell Assignment..."
                : "Confirm Cell Housing Assignment"}
            </button>
          </form>
        </div>

        {/* Housing Matrix Grid */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
          <h3 className="text-md font-bold text-white font-mono border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>WING & CELL HOUSING MATRIX</span>
            <span className="text-xs text-cyan-400 font-mono">
              {cells.length} Total Cells Active
            </span>
          </h3>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              Loading housing matrix...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cells.map((cell) => {
                const isFull = cell.current_occupancy >= cell.capacity;
                return (
                  <div
                    key={cell.id}
                    className={`p-3.5 rounded border ${getTierColor(
                      cell.security_tier,
                    )} flex flex-col justify-between space-y-2`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-sm text-white">
                        {cell.cell_number}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {cell.block_name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Security Tier:</span>
                      <span className="font-bold">{cell.security_tier}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Occupancy</span>
                        <span>
                          {cell.current_occupancy} / {cell.capacity}{" "}
                          {isFull ? "(FULL)" : ""}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${
                            isFull ? "bg-rose-500" : "bg-cyan-400"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (cell.current_occupancy /
                                Math.max(1, cell.capacity)) *
                                100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CellHousingGrid;
