import React, { useState, useEffect } from "react";
import HousingCellGrid from "../components/HousingCellGrid.jsx";
import {
  getHousingUnits,
  getInmates,
  assignHousingCell,
  createKeepAwayRule,
} from "../services/api.js";
import { Shield, ShieldAlert, Plus, CheckCircle2 } from "lucide-react";

export default function HousingPage() {
  const [units, setUnits] = useState([]);
  const [inmates, setInmates] = useState([]);
  const [keepAwayRule, setKeepAwayRule] = useState({
    inmate_id: "",
    keep_away_inmate_id: "",
    reason: "Co-defendant Conflict",
  });
  const [ruleStatus, setRuleStatus] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [uData, iData] = await Promise.all([
          getHousingUnits().catch(() => []),
          getInmates().catch(() => []),
        ]);
        setUnits(Array.isArray(uData) ? uData : uData?.items || []);
        setInmates(Array.isArray(iData) ? iData : iData?.items || []);
      } catch (e) {
        console.warn("API load error on Housing page:", e);
      }
    }
    loadData();
  }, []);

  const handleCellAssign = async (assignmentData) => {
    return await assignHousingCell(assignmentData);
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!keepAwayRule.inmate_id || !keepAwayRule.keep_away_inmate_id) {
      setRuleStatus({
        type: "error",
        text: "Select both primary and conflicting inmate.",
      });
      return;
    }

    try {
      await createKeepAwayRule(keepAwayRule);
      setRuleStatus({
        type: "success",
        text: "Keep-Away rule registered & enforced across cell assignment engine.",
      });
    } catch (err) {
      setRuleStatus({
        type: "error",
        text: err.message || "Failed to register Keep-Away rule.",
      });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
          Housing Assignment & Keep-Away Rule Manager
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Classification matching, capacity limits & co-defendant / gang
          conflict isolation
        </p>
      </div>

      <HousingCellGrid
        units={units}
        inmates={inmates}
        onAssignCell={handleCellAssign}
      />

      {/* Keep-Away Conflict Rule Creation Form */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#334155]">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#2563EB]">
              <ShieldAlert className="w-5 h-5 text-[#F59E0B]" /> Register
              Keep-Away Conflict Rule
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Enforce strict co-assignment prohibition between co-defendants or
              rival gang members
            </p>
          </div>
        </div>

        {ruleStatus && (
          <div
            className={`mb-6 p-4 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
              ruleStatus.type === "success"
                ? "bg-[#064E3B] border-[#10B981] text-[#10B981]"
                : "bg-[#7F1D1D] border-[#EF4444] text-[#FCA5A5]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> {ruleStatus.text}
          </div>
        )}

        <form
          onSubmit={handleCreateRule}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Primary Inmate
            </label>
            <input
              type="text"
              placeholder="e.g. Marcus Vance (inmate-101)"
              value={keepAwayRule.inmate_id}
              onChange={(e) =>
                setKeepAwayRule({ ...keepAwayRule, inmate_id: e.target.value })
              }
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Conflicting Inmate (Keep-Away Target)
            </label>
            <input
              type="text"
              placeholder="e.g. Damian Reed (inmate-102)"
              value={keepAwayRule.keep_away_inmate_id}
              onChange={(e) =>
                setKeepAwayRule({
                  ...keepAwayRule,
                  keep_away_inmate_id: e.target.value,
                })
              }
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Incompatibility Reason
            </label>
            <select
              value={keepAwayRule.reason}
              onChange={(e) =>
                setKeepAwayRule({ ...keepAwayRule, reason: e.target.value })
              }
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="Co-defendant Conflict">
                Co-defendant Conflict
              </option>
              <option value="Rival Gang Affiliation">
                Rival Gang Affiliation
              </option>
              <option value="Medical / Psychiatric Isolation">
                Medical / Psychiatric Isolation
              </option>
              <option value="Witness Protection">Witness Protection</option>
            </select>
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#F59E0B] hover:bg-yellow-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Enforce Keep-Away Restriction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
