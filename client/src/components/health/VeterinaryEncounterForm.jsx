import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function VeterinaryEncounterForm({ onSubmit, cattleList = [] }) {
  const [formData, setFormData] = useState({
    cow_id: "",
    record_type: "Treatment",
    diagnosis: "Mastitis - Left Quarter",
    medication_administered: "Antibiotic X (Ceftiofur / Penicillin)",
    dosage: "20ml IM daily for 3 days",
    treatment_date: new Date().toISOString().slice(0, 16),
    milk_withdrawal_hours: "96",
    meat_withdrawal_days: "14",
    veterinarian_name: "Dr. Sarah Mitchell, DVM",
  });

  const [calculatedWithdrawalEnd, setCalculatedWithdrawalEnd] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recordTypes = [
    "Treatment",
    "Vaccination",
    "Routine Checkup",
    "Hoof Trimming",
    "Surgery",
    "Quarantine",
  ];

  // Calculate milk withdrawal end timestamp
  useEffect(() => {
    if (formData.treatment_date && formData.milk_withdrawal_hours) {
      try {
        const hours = parseInt(formData.milk_withdrawal_hours, 10);
        if (!isNaN(hours) && hours > 0) {
          const tDate = new Date(formData.treatment_date);
          if (!isNaN(tDate.getTime())) {
            const endDate = new Date(tDate.getTime() + hours * 60 * 60 * 1000);
            setCalculatedWithdrawalEnd(endDate.toLocaleString());
          }
        } else {
          setCalculatedWithdrawalEnd("None (0 hours)");
        }
      } catch {
        setCalculatedWithdrawalEnd("");
      }
    }
  }, [formData.treatment_date, formData.milk_withdrawal_hours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.cow_id) {
      setError("Please select a cow.");
      return;
    }

    if (!formData.diagnosis.trim()) {
      setError("Please specify the diagnosis or reason for encounter.");
      return;
    }

    const hours = parseInt(formData.milk_withdrawal_hours, 10) || 0;
    let endIso = null;
    if (hours > 0 && formData.treatment_date) {
      const tDate = new Date(formData.treatment_date);
      endIso = new Date(tDate.getTime() + hours * 60 * 60 * 1000).toISOString();
    }

    const payload = {
      cow_id: formData.cow_id,
      record_type: formData.record_type,
      diagnosis: formData.diagnosis,
      medication_administered: formData.medication_administered || null,
      dosage: formData.dosage || null,
      treatment_date: new Date(formData.treatment_date).toISOString(),
      milk_withdrawal_hours: hours,
      milk_withdrawal_end: endIso,
      meat_withdrawal_days: parseInt(formData.meat_withdrawal_days, 10) || 0,
      veterinarian_name: formData.veterinarian_name,
    };

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
      setSuccess(
        `Health record logged for ${formData.cow_id}. ${
          hours > 0
            ? `Active milk withholding enforced for ${hours} hours.`
            : "No withdrawal required."
        }`,
      );
      setFormData({
        cow_id: "",
        record_type: "Treatment",
        diagnosis: "Mastitis - Left Quarter",
        medication_administered: "Antibiotic X (Ceftiofur / Penicillin)",
        dosage: "20ml IM daily for 3 days",
        treatment_date: new Date().toISOString().slice(0, 16),
        milk_withdrawal_hours: "96",
        meat_withdrawal_days: "14",
        veterinarian_name: "Dr. Sarah Mitchell, DVM",
      });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save veterinary health record.";
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
      record_type: "Treatment",
      diagnosis: "Clinical Mastitis in front-left quarter",
      medication_administered: "Antibiotic X (Spectramast LC)",
      dosage: "10ml intramammary infusion per 24h",
      treatment_date: new Date().toISOString().slice(0, 16),
      milk_withdrawal_hours: "96",
      meat_withdrawal_days: "14",
      veterinarian_name: "Dr. Sarah Mitchell, DVM",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#DBE5E0] shadow-sm p-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#DBE5E0] mb-5">
        <div>
          <h3 className="text-base font-bold text-[#171F24] flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-[#0D7A52]" />
            <span>Veterinary Encounter & Drug Withholding Logger</span>
          </h3>
          <p className="text-xs text-[#6B7A73]">
            Enforces FDA/Dairy compliance by locking milk from bulk sales during
            active withdrawal
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

      {parseInt(formData.milk_withdrawal_hours, 10) > 0 && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FDF0ED] border border-[#E76F51] rounded-lg flex items-start space-x-2 text-xs text-[#D92929]"
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[#E76F51]" />
          <div>
            <strong className="font-semibold block">
              Automated Milk Withholding Notice (
              {formData.milk_withdrawal_hours} Hours)
            </strong>
            Milk from this cow will be withheld from all bulk milk sales until:{" "}
            <strong>{calculatedWithdrawalEnd || "calculated end date"}</strong>.
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
              Record / Encounter Type
            </label>
            <select
              value={formData.record_type}
              onChange={(e) =>
                setFormData({ ...formData, record_type: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            >
              {recordTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Diagnosis / Clinical Finding *
            </label>
            <input
              type="text"
              placeholder="e.g. Mastitis - Left Quarter"
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Medication Administered
            </label>
            <input
              type="text"
              placeholder="e.g. Antibiotic X / Oxytetracycline"
              value={formData.medication_administered}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  medication_administered: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Dosage & Route
            </label>
            <input
              type="text"
              placeholder="e.g. 20ml IM daily for 3 days"
              value={formData.dosage}
              onChange={(e) =>
                setFormData({ ...formData, dosage: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Treatment Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.treatment_date}
              onChange={(e) =>
                setFormData({ ...formData, treatment_date: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Milk Withdrawal Period (Hours) *
            </label>
            <input
              type="number"
              placeholder="e.g. 96"
              value={formData.milk_withdrawal_hours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  milk_withdrawal_hours: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171F24] mb-1">
              Meat Withdrawal Period (Days)
            </label>
            <input
              type="number"
              placeholder="e.g. 14"
              value={formData.meat_withdrawal_days}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  meat_withdrawal_days: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:ring-1 focus:ring-[#0D7A52] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171F24] mb-1">
            Attending Veterinarian Name
          </label>
          <input
            type="text"
            placeholder="e.g. Dr. Sarah Mitchell, DVM"
            value={formData.veterinarian_name}
            onChange={(e) =>
              setFormData({ ...formData, veterinarian_name: e.target.value })
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
            <Stethoscope className="w-4 h-4" />
            <span>{isSubmitting ? "Logging..." : "Log Health Encounter"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
