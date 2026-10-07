import React, { useState } from "react";
import { X, Heart, AlertCircle } from "lucide-react";

export const HealthRecordModal = ({
  isOpen,
  onClose,
  onSave,
  cows = [],
  defaultCowId = "",
}) => {
  const [formData, setFormData] = useState({
    cow_id: defaultCowId || cows[0]?.id || cows[0]?.tag_id || "",
    record_type: "Checkup",
    title: "",
    diagnosis: "",
    treatment_plan: "",
    event_date: new Date().toISOString().split("T")[0],
    next_due_date: "",
    administered_by: "Dr. Sarah (Lead Vet)",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.cow_id) {
      setFormError("Please select a cow.");
      return;
    }

    if (!formData.title.trim()) {
      setFormError("Please provide an event title or diagnosis summary.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to record health event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Heart className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Record Medical / Veterinary Event
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Cattle *
              </label>
              <select
                required
                value={formData.cow_id}
                onChange={(e) =>
                  setFormData({ ...formData, cow_id: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Cow --</option>
                {cows.map((c) => (
                  <option key={c.id || c.tag_id} value={c.id || c.tag_id}>
                    {c.tag_id} ({c.breed})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Type *
              </label>
              <select
                value={formData.record_type}
                onChange={(e) =>
                  setFormData({ ...formData, record_type: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Checkup">General Checkup</option>
                <option value="Vaccination">Vaccination</option>
                <option value="Treatment">Medical Treatment</option>
                <option value="Surgery">Surgical Procedure</option>
                <option value="Quarantine">Quarantine Isolation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Title / Reason *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Annual BVD Booster or Mastitis Treatment"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diagnosis & Clinical Observations
            </label>
            <textarea
              rows="2"
              placeholder="Describe symptoms, temperature, physical observations..."
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Treatment Plan / Administered Medication
            </label>
            <input
              type="text"
              placeholder="e.g. 20ml Penicillin IM, daily topical antiseptic wash"
              value={formData.treatment_plan}
              onChange={(e) =>
                setFormData({ ...formData, treatment_plan: e.target.value })
              }
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-up Due Date
              </label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) =>
                  setFormData({ ...formData, next_due_date: e.target.value })
                }
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Administered By / Veterinarian
            </label>
            <input
              type="text"
              value={formData.administered_by}
              onChange={(e) =>
                setFormData({ ...formData, administered_by: e.target.value })
              }
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Health Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthRecordModal;
