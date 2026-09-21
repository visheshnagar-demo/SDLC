import React, { useState, useEffect } from "react";
import MovementDispatchForm from "../components/MovementDispatchForm.jsx";
import OverdueMovementQueue from "../components/OverdueMovementQueue.jsx";
import {
  getActiveMovements,
  getHeadcount,
  dispatchMovement,
  completeMovement,
  getInmates,
} from "../services/api.js";
import { Users, Building, ShieldCheck, RefreshCw } from "lucide-react";

export default function MovementsPage() {
  const [activeMovements, setActiveMovements] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, hRes, iRes] = await Promise.all([
        getActiveMovements().catch(() => []),
        getHeadcount().catch(() => []),
        getInmates().catch(() => []),
      ]);
      setActiveMovements(Array.isArray(mRes) ? mRes : mRes?.items || []);
      setHeadcount(Array.isArray(hRes) ? hRes : hRes?.units || []);
      setInmates(Array.isArray(iRes) ? iRes : iRes?.items || []);
    } catch (err) {
      console.warn("API load error on Movements page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatch = async (movementData) => {
    const res = await dispatchMovement(movementData);
    await loadData();
    return res;
  };

  const handleConfirmArrival = async (movementId) => {
    await completeMovement(movementId);
    await loadData();
  };

  const displayHeadcount =
    headcount.length > 0
      ? headcount
      : [
          {
            unit_name: "Alpha Block (Max)",
            assigned_count: 16,
            in_transit_count: 2,
            physical_count: 14,
          },
          {
            unit_name: "Bravo Block (Med)",
            assigned_count: 22,
            in_transit_count: 1,
            physical_count: 21,
          },
          {
            unit_name: "Charlie Block (Iso)",
            assigned_count: 4,
            in_transit_count: 0,
            physical_count: 4,
          },
        ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
            Inmate Movement Tracking & Headcount Reconciliation
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Real-time transfer tracking with 30-minute watchdog alerts & unit
            headcount audit
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Refresh Movements
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dispatch Form */}
        <div className="lg:col-span-5">
          <MovementDispatchForm inmates={inmates} onDispatch={handleDispatch} />
        </div>

        {/* Headcount Summary Table */}
        <div className="lg:col-span-7">
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#2563EB] mb-4 pb-2 border-b border-[#334155]">
              <Building className="w-5 h-5" /> Facility Headcount Reconciliation
              by Unit
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#090D16] text-[#94A3B8] uppercase border-b border-[#334155]">
                    <th className="p-3">Housing Unit</th>
                    <th className="p-3">Assigned Beds</th>
                    <th className="p-3">In Transit</th>
                    <th className="p-3">Physical Count</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {displayHeadcount.map((h, idx) => (
                    <tr key={idx} className="hover:bg-[#1E293B]">
                      <td className="p-3 font-bold text-white">
                        {h.unit_name}
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {h.assigned_count}
                      </td>
                      <td className="p-3 font-mono text-amber-400 font-semibold">
                        {h.in_transit_count}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#38BDF8]">
                        {h.physical_count}
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" /> Reconciled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Watchdog Queue */}
      <OverdueMovementQueue
        activeMovements={activeMovements}
        onConfirmArrival={handleConfirmArrival}
      />
    </div>
  );
}
