import React, { useState } from "react";
import { UserPlus, AlertTriangle, CheckCircle, X } from "lucide-react";
import { createInmate } from "../../services/api";

export function InmateIntakeModal({
  isOpen,
  onClose,
  onSuccess,
  userRole = "ADMIN",
}) {
  const [formData, setFormData] = useState({
    inmate_number: "INM-" + Math.floor(1000 + Math.random() * 9000),
    first_name: "",
    last_name: "",
    date_of_birth: "",
    security_tier: "MEDIUM",
    offense_history: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_alert_tags: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const isGuard = userRole === "GUARD";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Parse medical alerts string into array
    const medicalAlertsArray = formData.medical_alert_tags
      ? formData.medical_alert_tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    const offenseArray = formData.offense_history
      ? formData.offense_history
          .split(",")
          .map((item) => ({ charge: item.trim() }))
      : [];

    const payload = {
      inmate_number: formData.inmate_number,
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      security_tier: formData.security_tier,
      medical_alerts: medicalAlertsArray,
      offense_history: offenseArray,
      emergency_contacts: [
        {
          name: formData.emergency_contact_name,
          phone: formData.emergency_contact_phone,
        },
      ],
    };

    try {
      const created = await createInmate(payload);
      setSuccessMessage(
        `Inmate Intake Registered Successfully! UUID: ${created.id || "Created"}`,
      );
      if (onSuccess) onSuccess(created);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to process inmate intake. Check parameters.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl font-sans text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-slate-800 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-cyan-400 font-mono flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> NEW INMATE INTAKE & MEDICAL RISK
              TAGGING
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              RECORD CODE: {formData.inmate_number} • ROLE: {userRole}
            </p>
          </div>
        </div>

        {isGuard && (
          <div className="mb-4 p-3 bg-amber-950/60 border border-amber-800 rounded text-amber-300 text-xs font-mono">
            ⚠️ NOTICE: Guards can initiate intake draft records but medical risk
            alerts require Medical Staff or Admin sign-off.
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">
                Inmate ID / Code
              </label>
              <input
                type="text"
                name="inmate_number"
                value={formData.inmate_number}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Security Tier Classification
              </label>
              <select
                name="security_tier"
                value={formData.security_tier}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="MINIMUM">MINIMUM SECURITY</option>
                <option value="MEDIUM">MEDIUM SECURITY</option>
                <option value="MAXIMUM">MAXIMUM SECURITY</option>
                <option value="HIGH_SECURITY">
                  HIGH SECURITY (SOLITARY/SPECIAL)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="e.g. John"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="e.g. Doe"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Offense Charges (comma separated)
              </label>
              <input
                type="text"
                name="offense_history"
                value={formData.offense_history}
                onChange={handleChange}
                placeholder="e.g. Armed Robbery, Aggravated Assault"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h3 className="text-slate-300 font-bold mb-2 text-xs">
              MEDICAL ALERTS & RISK TAGS
            </h3>
            <div>
              <label className="block text-slate-400 mb-1">
                Medical Alert Tags (comma-separated, e.g. Diabetes, Insulin
                Required, Heart Condition)
              </label>
              <input
                type="text"
                name="medical_alert_tags"
                value={formData.medical_alert_tags}
                onChange={handleChange}
                placeholder="e.g. HIGH_RISK_ASTHMA, SEVERE_ALLERGY, PSYCH_EVAL"
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                disabled={isGuard}
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h3 className="text-slate-300 font-bold mb-2 text-xs">
              EMERGENCY CONTACT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="e.g. Mary Doe (Sister)"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="e.g. 555-0199"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs shadow flex items-center gap-1.5"
            >
              {submitting ? "Registering Intake..." : "Submit Inmate Intake"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InmateIntakeModal;
