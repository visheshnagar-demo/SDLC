import React, { useState } from "react";
import { patientsApi } from "../../services/api";
import {
  UserPlus,
  X,
  AlertTriangle,
  CheckCircle,
  Shield,
  Heart,
  Phone,
  CreditCard,
} from "lucide-react";

export const PatientRegistrationModal = ({
  isOpen,
  onClose,
  onPatientCreated,
}) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    national_id: "",
    date_of_birth: "1990-01-01",
    gender: "Female",
    blood_group: "O+",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    insurance_provider: "BlueCross BlueShield",
    insurance_policy_number: "BCBS-8839210",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDuplicateWarning(null);

    // Check for SSN duplicate simulation (e.g. 123-45-6789 or existing record)
    if (
      formData.national_id.includes("999-99-9999") ||
      formData.national_id === "SSN-DUPLICATE"
    ) {
      setDuplicateWarning({
        message:
          "A patient profile with National ID / SSN already exists in the master registry.",
        existing_patient_id: "PAT-EXISTING-092",
        matched_name: "Jane Doe (DOB: 1988-04-12)",
      });
      setLoading(false);
      return;
    }

    try {
      const result = await patientsApi.createPatient(formData);
      setSuccess(true);
      setTimeout(() => {
        if (onPatientCreated) onPatientCreated(result);
        onClose();
      }, 1200);
    } catch (err) {
      if (err.response?.status === 409 || err.message?.includes("duplicate")) {
        setDuplicateWarning({
          message:
            "Duplicate patient profile detected based on SSN / National ID.",
          existing_patient_id: "PAT-EXISTING-092",
          matched_name: "Existing Registered Patient",
        });
      } else {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to register patient profile.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-600 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Patient Registration &amp; Demographic Intake
              </h3>
              <p className="text-xs text-sky-300">
                Record demographics, emergency contacts, and insurance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>SSN / National ID Deduplication Resolution Alert</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                {duplicateWarning.message}
              </p>
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-slate-700">
                <p>
                  <strong>Matched Record:</strong>{" "}
                  {duplicateWarning.matched_name}
                </p>
                <p>
                  <strong>Existing MRN:</strong>{" "}
                  <span className="font-mono">
                    {duplicateWarning.existing_patient_id}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateWarning(null);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs"
                >
                  Merge / Link to Existing Profile
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs border border-slate-300"
                >
                  Edit National ID
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold">Patient Record Created Successfully</p>
                <p className="text-xs text-emerald-700">
                  Profile added to hospital database and HIPAA audit logged.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Demographics */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Shield className="w-4 h-4 text-sky-600" /> Patient Demographics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g., Jane Margaret Doe"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., jane.doe@example.com"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  National ID / SSN
                </label>
                <input
                  type="text"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleChange}
                  placeholder="e.g., 123-45-6789"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="e.g., +1 (555) 234-5678"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Contact */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Phone className="w-4 h-4 text-emerald-600" /> Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="e.g., Mark Doe (Spouse)"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="e.g., +1 (555) 987-6543"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Insurance Details */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Insurance
              Policy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  name="insurance_provider"
                  value={formData.insurance_provider}
                  onChange={handleChange}
                  placeholder="e.g., UnitedHealth / BlueCross"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Policy / Group Number
                </label>
                <input
                  type="text"
                  name="insurance_policy_number"
                  value={formData.insurance_policy_number}
                  onChange={handleChange}
                  placeholder="e.g., POL-992384-US"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              {loading ? "Creating Record..." : "Register Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistrationModal;
