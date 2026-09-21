import React, { useState } from "react";
import { ArrowRightLeft, Clock, ShieldCheck, AlertCircle } from "lucide-react";

export default function MovementDispatchForm({ inmates = [], onDispatch }) {
  const [formData, setFormData] = useState({
    inmate_id: "",
    source_location: "Housing Block A",
    destination_location: "Medical Clinic",
    purpose: "Routine Medical Exam",
    escort_officer: "Officer J. Smith (ID-8821)",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.inmate_id) {
      setStatusMsg({
        type: "error",
        text: "Please select an inmate to dispatch.",
      });
      return;
    }

    try {
      if (onDispatch) {
        await onDispatch(formData);
      }
      setStatusMsg({
        type: "success",
        text: `Movement dispatched for inmate ${formData.inmate_id} to ${formData.destination_location}. 30-minute watchdog timer initiated.`,
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to dispatch movement.",
      });
    }
  };

  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#334155]">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#2563EB]">
            <ArrowRightLeft className="w-5 h-5" /> Dispatch Inmate Movement
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Initiate intra-facility transfers, court appearances, and medical
            visits with supervision
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm font-semibold flex items-center gap-2 border ${
            statusMsg.type === "success"
              ? "bg-[#064E3B] border-[#10B981] text-[#10B981]"
              : "bg-[#7F1D1D] border-[#EF4444] text-[#FCA5A5]"
          }`}
        >
          {statusMsg.type === "success" ? (
            <ShieldCheck className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
            Select Inmate *
          </label>
          <select
            required
            value={formData.inmate_id}
            onChange={(e) =>
              setFormData({ ...formData, inmate_id: e.target.value })
            }
            className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">-- Choose Inmate for Dispatch --</option>
            {displayInmates.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.booking_number})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Source Location *
            </label>
            <input
              type="text"
              required
              value={formData.source_location}
              onChange={(e) =>
                setFormData({ ...formData, source_location: e.target.value })
              }
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Destination Location *
            </label>
            <input
              type="text"
              required
              value={formData.destination_location}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  destination_location: e.target.value,
                })
              }
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Transfer Purpose *
            </label>
            <select
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="Routine Medical Exam">Routine Medical Exam</option>
              <option value="Court Hearing / Appearance">
                Court Hearing / Appearance
              </option>
              <option value="Recreation Yard">Recreation Yard</option>
              <option value="Attorney Visit">Attorney Visit</option>
              <option value="Disciplinary Transfer">
                Disciplinary Transfer
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Escort Officer / ID *
            </label>
            <input
              type="text"
              required
              value={formData.escort_officer}
              onChange={(e) =>
                setFormData({ ...formData, escort_officer: e.target.value })
              }
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="p-3 bg-[#090D16] border border-[#334155] rounded-lg flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-[#38BDF8]" /> Automatic Watchdog
            Timer:
          </span>
          <span className="text-[#38BDF8] font-bold">
            30-Min Overdue Threshold
          </span>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#2563EB] hover:bg-blue-600 text-white font-bold rounded-lg transition-colors shadow-lg"
        >
          Dispatch Inmate Movement & Start Watchdog
        </button>
      </form>
    </div>
  );
}
