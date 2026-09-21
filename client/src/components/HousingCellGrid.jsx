import React, { useState } from "react";
import { Home, Users, ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import KeepAwayConflictWarning from "./KeepAwayConflictWarning.jsx";

export default function HousingCellGrid({
  units = [],
  inmates = [],
  onAssignCell,
}) {
  const [selectedUnit, setSelectedUnit] = useState(units[0]?.id || "unit-1");
  const [selectedInmateId, setSelectedInmateId] = useState("");
  const [selectedCell, setSelectedCell] = useState("");
  const [conflictDetails, setConflictDetails] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  // Default sample housing units if API hasn't loaded
  const displayUnits =
    units.length > 0
      ? units
      : [
          {
            id: "unit-1",
            name: "Alpha Block (Maximum Security)",
            security_level: "Maximum",
            capacity: 20,
            occupancy: 16,
          },
          {
            id: "unit-2",
            name: "Bravo Block (Medium Security)",
            security_level: "Medium",
            capacity: 30,
            occupancy: 22,
          },
          {
            id: "unit-3",
            name: "Charlie Block (Medical Isolation)",
            security_level: "Administrative Isolation",
            capacity: 10,
            occupancy: 4,
          },
        ];

  const displayInmates =
    inmates.length > 0
      ? inmates
      : [
          {
            id: "inmate-101",
            name: "Marcus Vance",
            booking_number: "BK-2026-0001",
            gang_affiliation: "Northside Syndicate",
            security_level: "Maximum",
          },
          {
            id: "inmate-102",
            name: "Damian Reed",
            booking_number: "BK-2026-0002",
            gang_affiliation: "Eastside Kings",
            security_level: "Maximum",
          },
        ];

  const handleCellClick = (cellNum) => {
    setSelectedCell(cellNum);

    // Simulate keep-away conflict check if assigning to cell 102 or 104 with Gang conflict
    if (cellNum === "A-102" || cellNum === "B-204") {
      const inmateObj =
        displayInmates.find((i) => i.id === selectedInmateId) ||
        displayInmates[0];
      setConflictDetails({
        inmate_name: inmateObj.name,
        cell_number: cellNum,
        reason: "Rival Gang Incompatibility (Northside vs Eastside)",
        conflict_inmate_name: "Damian Reed (BK-2026-0002)",
      });
    } else {
      setConflictDetails(null);
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedInmateId || !selectedCell) {
      setStatusMsg({
        type: "error",
        text: "Please select an inmate and a cell block.",
      });
      return;
    }

    if (onAssignCell) {
      onAssignCell({
        inmate_id: selectedInmateId,
        unit_id: selectedUnit,
        cell_number: selectedCell,
        override: !!conflictDetails,
      });
    }

    setStatusMsg({
      type: "success",
      text: `Inmate successfully assigned to Cell ${selectedCell} in Unit ${selectedUnit}.`,
    });
    setConflictDetails(null);
  };

  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#334155]">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#2563EB]">
            <Home className="w-5 h-5" /> Housing Assignment & Cell Block Matrix
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time occupancy, classification matching & Keep-Away conflict
            enforcement
          </p>
        </div>
      </div>

      <KeepAwayConflictWarning
        conflictDetails={conflictDetails}
        onCancel={() => setConflictDetails(null)}
        onAuthorizeOverride={() => {
          setStatusMsg({
            type: "warning",
            text: "Supervisor Override authorized with PIN. Proceeding with cell assignment.",
          });
          setConflictDetails(null);
        }}
      />

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm font-semibold border ${
            statusMsg.type === "success"
              ? "bg-[#064E3B] border-[#10B981] text-[#10B981]"
              : statusMsg.type === "warning"
                ? "bg-[#451A03] border-[#F59E0B] text-[#F59E0B]"
                : "bg-[#7F1D1D] border-[#EF4444] text-[#FCA5A5]"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" /> {statusMsg.text}
        </div>
      )}

      {/* Unit Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {displayUnits.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setSelectedUnit(u.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedUnit === u.id
                ? "bg-[#1E293B] border-[#2563EB] shadow-md ring-1 ring-[#2563EB]"
                : "bg-[#090D16] border-[#334155] hover:border-[#94A3B8]"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-sm text-[#F8FAFC]">{u.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-500/30 rounded">
                {u.security_level}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <Users className="w-3.5 h-3.5" /> Occupancy: {u.occupancy} /{" "}
              {u.capacity} Beds
            </div>
            <div className="w-full bg-[#334155] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#2563EB] h-full"
                style={{ width: `${(u.occupancy / u.capacity) * 100}%` }}
              ></div>
            </div>
          </button>
        ))}
      </div>

      {/* Inmate Selection & Assignment controls */}
      <form onSubmit={handleAssignSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#090D16] p-4 rounded-lg border border-[#334155]">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Select Inmate to Assign
            </label>
            <select
              value={selectedInmateId}
              onChange={(e) => setSelectedInmateId(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">-- Choose Unassigned Inmate --</option>
              {displayInmates.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.booking_number}) - Gang: {i.gang_affiliation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Selected Target Cell
            </label>
            <input
              type="text"
              readOnly
              value={selectedCell || "Click cell in grid below"}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#38BDF8] font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Visual Cell Matrix */}
        <div>
          <h3 className="text-xs font-bold text-[#94A3B8] uppercase mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" /> Cell Layout for{" "}
            {displayUnits.find((u) => u.id === selectedUnit)?.name ||
              "Selected Unit"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[
              "A-101",
              "A-102",
              "A-103",
              "A-104",
              "A-105",
              "A-106",
              "A-107",
              "A-108",
              "A-109",
              "A-110",
              "A-111",
              "A-112",
            ].map((cellNum) => {
              const isOccupied = cellNum === "A-101" || cellNum === "A-103";
              const isConflictCell = cellNum === "A-102";
              const isSelected = selectedCell === cellNum;

              return (
                <button
                  key={cellNum}
                  type="button"
                  onClick={() => handleCellClick(cellNum)}
                  className={`p-3 rounded-lg border text-center font-mono text-xs transition-all ${
                    isSelected
                      ? "bg-[#2563EB] text-white border-white shadow-lg ring-2 ring-blue-400 font-bold"
                      : isConflictCell
                        ? "bg-red-950/60 border-red-500 text-red-200 hover:bg-red-900"
                        : isOccupied
                          ? "bg-[#1E293B] border-[#334155] text-slate-400 cursor-default opacity-80"
                          : "bg-[#090D16] border-[#334155] text-[#38BDF8] hover:border-[#38BDF8]"
                  }`}
                >
                  <div className="font-bold">{cellNum}</div>
                  <div className="text-[10px] mt-1">
                    {isOccupied
                      ? "Occupied"
                      : isConflictCell
                        ? "Keep-Away"
                        : "Available"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#2563EB] hover:bg-blue-600 font-bold text-white text-sm rounded-lg transition-colors shadow-lg"
        >
          Confirm Cell Assignment & Log Housing Update
        </button>
      </form>
    </div>
  );
}
