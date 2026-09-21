import React, { useState } from "react";
import {
  FileCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  XCircle,
  AlertOctagon,
} from "lucide-react";

export default function ReleaseChecklistGate({
  inmates = [],
  onAuthorizeRelease,
}) {
  const [selectedInmateId, setSelectedInmateId] = useState("");
  const [checklist, setChecklist] = useState({
    discharge_order_verified: true,
    active_warrants_cleared: true,
    detainers_cleared: false, // Default pending to show block check
    property_returned: true,
    victim_notified: true,
  });

  const [statusMsg, setStatusMsg] = useState(null);

  const displayInmates =
    inmates.length > 0
      ? inmates
      : [
          {
            id: "inmate-101",
            name: "Marcus Vance",
            booking_number: "BK-2026-0001",
          },
          {
            id: "inmate-102",
            name: "Damian Reed",
            booking_number: "BK-2026-0002",
          },
        ];

  const handleCheckboxChange = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isEligible =
    checklist.discharge_order_verified &&
    checklist.active_warrants_cleared &&
    checklist.detainers_cleared &&
    checklist.property_returned &&
    checklist.victim_notified;

  const handleAuthorize = async () => {
    if (!selectedInmateId) {
      setStatusMsg({
        type: "error",
        text: "Please select an inmate for discharge processing.",
      });
      return;
    }

    if (!isEligible) {
      setStatusMsg({
        type: "error",
        text: "HARD STOP: Discharge prohibited until all statutory hold and detainer verifications are cleared.",
      });
      return;
    }

    try {
      if (onAuthorizeRelease) {
        await onAuthorizeRelease({
          inmate_id: selectedInmateId,
          ...checklist,
          authorized_by: "Officer J. Smith (ID-8821)",
        });
      }
      setStatusMsg({
        type: "success",
        text: `Inmate ${selectedInmateId} release authorized and logged to immutable audit trail.`,
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.message || "Authorization failed.",
      });
    }
  };

  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#334155]">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#2563EB]">
            <FileCheck className="w-5 h-5" /> Statutory Release Checklist &
            Detainer Gate
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Automated compliance verification & hard-stop discharge
            authorization
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-lg font-semibold text-sm flex items-center gap-2 border ${
            statusMsg.type === "success"
              ? "bg-[#064E3B] border-[#10B981] text-[#10B981]"
              : "bg-[#7F1D1D] border-[#EF4444] text-[#FCA5A5]"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertOctagon className="w-5 h-5" />
          )}
          {statusMsg.text}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
            Select Inmate for Release Audit *
          </label>
          <select
            value={selectedInmateId}
            onChange={(e) => setSelectedInmateId(e.target.value)}
            className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">-- Choose Inmate to Audit for Release --</option>
            {displayInmates.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.booking_number})
              </option>
            ))}
          </select>
        </div>

        {/* Verification Checklist Items */}
        <div className="bg-[#090D16] border border-[#334155] rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-[#94A3B8] uppercase border-b border-[#334155] pb-2">
            Mandatory Verification Criteria
          </h3>

          <label className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#334155] cursor-pointer hover:border-slate-500">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.discharge_order_verified}
                onChange={() =>
                  handleCheckboxChange("discharge_order_verified")
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <span className="text-sm font-semibold text-white">
                Court Discharge Order Verified
              </span>
            </div>
            {checklist.discharge_order_verified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </label>

          <label className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#334155] cursor-pointer hover:border-slate-500">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.active_warrants_cleared}
                onChange={() => handleCheckboxChange("active_warrants_cleared")}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <span className="text-sm font-semibold text-white">
                Active Warrants Cleared (NCIC Check)
              </span>
            </div>
            {checklist.active_warrants_cleared ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </label>

          <label className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#334155] cursor-pointer hover:border-slate-500">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.detainers_cleared}
                onChange={() => handleCheckboxChange("detainers_cleared")}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <div>
                <span className="text-sm font-semibold text-white">
                  Immigration / Inter-Agency Detainers Cleared
                </span>
                {!checklist.detainers_cleared && (
                  <p className="text-xs text-red-400 font-normal">
                    Pending ICE Detainer #ICE-9021
                  </p>
                )}
              </div>
            </div>
            {checklist.detainers_cleared ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </label>

          <label className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#334155] cursor-pointer hover:border-slate-500">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.property_returned}
                onChange={() => handleCheckboxChange("property_returned")}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <span className="text-sm font-semibold text-white">
                Property Inventory Returned & Signed
              </span>
            </div>
            {checklist.property_returned ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </label>

          <label className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-[#334155] cursor-pointer hover:border-slate-500">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.victim_notified}
                onChange={() => handleCheckboxChange("victim_notified")}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <span className="text-sm font-semibold text-white">
                VINE / Victim Notification Transmitted
              </span>
            </div>
            {checklist.victim_notified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </label>
        </div>

        {/* Release Status Gate Indicator */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isEligible
              ? "bg-[#064E3B]/40 border-[#10B981] text-[#10B981]"
              : "bg-[#450A0A]/60 border-[#EF4444] text-[#EF4444]"
          }`}
        >
          <div className="flex items-center gap-2">
            {isEligible ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
            <div>
              <span className="font-bold text-sm block uppercase">
                {isEligible
                  ? "RELEASE AUTHORIZATION PERMITTED"
                  : "HARD STOP: DISCHARGE BLOCKED"}
              </span>
              <span className="text-xs text-slate-300 font-normal">
                {isEligible
                  ? "All 5 statutory verification points passed."
                  : "Clear all pending detainers and warrants before authorization."}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!isEligible}
          onClick={handleAuthorize}
          className="w-full py-3 bg-[#2563EB] hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-white text-sm rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" /> Finalize Discharge & Authorize Inmate
          Release
        </button>
      </div>
    </div>
  );
}
