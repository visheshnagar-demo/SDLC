import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

export default function BreedingEventForm({ onSubmit, cattleList = [] }) {
  const [formData, setFormData] = useState({
    cow_id: "",
    stage: "Inseminated",
    event_date: new Date().toISOString().split("T")[0],
    sire_rfid_or_code: "BULL-0089",
    notes: "AI service with certified Sire semen batch #A-89",
  });

  const [calculatedGestationCheck, setCalculatedGestationCheck] = useState("");
  const [calculatedCalvingDate, setCalculatedCalvingDate] = useState("");
  const [isResetCycle, setIsResetCycle] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stages = [
    "In Heat",
    "Inseminated",
    "Confirmed Pregnant",
    "Dry Period",
    "Calved",
  ];

  // Helper to add days to ISO date
  const addDays = (dateStr, days) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (formData.stage === "Inseminated" && formData.event_date) {
      // 44-day gestation check (approx 44-45 days), 283-day gestation for dairy cows
      setCalculatedGestationCheck(addDays(formData.event_date, 44));
      setCalculatedCalvingDate(addDays(formData.event_date, 283));
      setIsResetCycle(false);
    } else if (formData.stage === "In Heat") {
      setCalculatedGestationCheck("");
      setCalculatedCalvingDate("");
      setIsResetCycle(true);
    } else {
      setIsResetCycle(false);
    }
  }, [formData.stage, formData.event_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.cow_id) {
      setError("Please select a cow.");
      return;
    }

    const payload = {
      cow_id: formData.cow_id,
      stage: formData.stage,
      event_date: formData.event_date,
      sire_rfid_or_code: formData.sire_rfid_or_code || null,
      gestation_check_due_date: calculatedGestationCheck || null,
      expected_calving_date: calculatedCalvingDate || null,
      notes: formData.notes,
    };

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
      setSuccess(
        `Breeding milestone recorded: ${formData.stage} (Calving target: ${
          calculatedCalvingDate || "N/A"
        })`,
      );
      setFormData({
        cow_id: "",
        stage: "Inseminated",
        event_date: new Date().toISOString().split("T")[0],
        sire_rfid_or_code: "BULL-0089",
        notes: "",
      });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to record breeding event.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSampleData = () => {
    const firstCow = cattleList[0] || {
      id: "COW-1042",
      tag_number: "COW-1042",
    };
    setFormData({
      cow_id: firstCow.id || firstCow.tag_number,
      stage: "Inseminated",
      event_date: "2025-06-01",
      sire_rfid_or_code: "BULL-0089",
      notes: "Artificial Insemination performed by technician",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#DBE5E0] shadow-sm p-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#DBE5E0] mb-5">
        <div>
          <h3 className="text-base font-bold text-[#171F24] flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-[#0D7A52]" />
            <span>Record Breeding & Lifecycle Milestone</span>
          </h3>
          <p className="text-xs text-[#6B7A73]">
            Calculates 44-day gestation ultrasound check and 283-day expected
            calving date
          </p>
        </div>
        <button
          type="button"
          onClick={fillSampleData}
          className="text-xs text-[#0D7A52] hover:underline font-medium bg-[#E7F5EE] px-2.5 py-1 rounded-md"
        >
          Fill Demo Sample
        </button>
      </div>

      {isResetCycle && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FEF7EC] border border-[#E5941A]/40 rounded-lg flex items-start space-x-2 text-xs text-[#E5941A]"
        >
          <RotateCcw className="w-4 h-4 flex-shrink-0 text-[#E5941A]" />
          <div>
            <strong className="font-semibold block">Cycle Reset Alert</strong>
            Logging "In Heat" will reset the previous breeding cycle and flag
            conception status as non-pregnant.
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FDF0ED] border border-[#D92929]/30 rounded-lg flex items-center space-x-2 text-xs text-[#D92929]"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-[#E7F5EE] border border-[#149E4D]/30 rounded-lg flex items-center space-x-2 text-xs text-[#149E4D]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Select Cow *
            </label>
            <select
              value={formData.cow_id}
              onChange={(e) =>
                setFormData({ ...formData, cow_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            >
              <option value="">-- Choose Cow --</option>
              {cattleList.map((c) => (
                <option key={c.id || c.tag_number} value={c.id || c.tag_number}>
                  {c.tag_number} ({c.breed}) - Status: {c.status}
                </option>
              ))}
              {cattleList.length === 0 && (
                <option value="COW-1042">COW-1042 (Holstein-Friesian)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Reproductive Stage *
            </label>
            <select
              value={formData.stage}
              onChange={(e) =>
                setFormData({ ...formData, stage: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            >
              {stages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Event Date *
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Sire RFID or Semen Code
            </label>
            <input
              type="text"
              placeholder="e.g. BULL-0089 / 982 000000891234"
              value={formData.sire_rfid_or_code}
              onChange={(e) =>
                setFormData({ ...formData, sire_rfid_or_code: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>
        </div>

        {formData.stage === "Inseminated" && (
          <div className="p-3 bg-[#E7F5EE] border border-[#0D7A52]/20 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#0D7A52]" />
              <div>
                <span className="text-[#6B7A73] block">
                  Gestation Check Due (+44d):
                </span>
                <strong className="text-[#0D7A52] text-sm">
                  {calculatedGestationCheck || "N/A"}
                </strong>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#0D7A52]" />
              <div>
                <span className="text-[#6B7A73] block">
                  Expected Calving Date (283d):
                </span>
                <strong className="text-[#0D7A52] text-sm">
                  {calculatedCalvingDate || "N/A"}
                </strong>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#171F24] mb-1">
            Notes / Observations
          </label>
          <input
            type="text"
            placeholder="e.g. Artificial Insemination performed, good standing heat"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#0D7A52] hover:bg-[#095C3E] text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <HeartPulse className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : "Record Milestone"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
