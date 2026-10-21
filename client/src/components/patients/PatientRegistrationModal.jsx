import React, { useState, useEffect } from "react";
import { X, UserPlus, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { patientsApi } from "../../services/api";

export function PatientRegistrationModal({
  isOpen,
  onClose,
  onPatientSaved,
  patientToEdit = null,
}) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "MALE",
    phone_number: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    insurance_provider: "",
    insurance_policy_number: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        first_name: patientToEdit.first_name || "",
        last_name: patientToEdit.last_name || "",
        date_of_birth: patientToEdit.date_of_birth || "",
        gender: patientToEdit.gender || "MALE",
        phone_number: patientToEdit.phone_number || "",
        email: patientToEdit.email || "",
        address: patientToEdit.address || "",
        emergency_contact_name: patientToEdit.emergency_contact_name || "",
        emergency_contact_phone: patientToEdit.emergency_contact_phone || "",
        insurance_provider: patientToEdit.insurance_provider || "",
        insurance_policy_number: patientToEdit.insurance_policy_number || "",
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        date_of_birth: "1985-04-12",
        gender: "MALE",
        phone_number: "+1 (555) 234-5678",
        email: "john.doe@example.com",
        address: "742 Evergreen Terrace, Springfield",
        emergency_contact_name: "Jane Doe",
        emergency_contact_phone: "+1 (555) 987-6543",
        insurance_provider: "BlueCross Health",
        insurance_policy_number: "POL-BC-88291",
      });
    }
    setError(null);
    setSuccessMessage(null);
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let result;
      if (patientToEdit && patientToEdit.id) {
        result = await patientsApi.update(patientToEdit.id, formData);
        setSuccessMessage("Patient profile updated successfully.");
      } else {
        result = await patientsApi.create(formData);
        setSuccessMessage("New patient registered successfully.");
      }
      setTimeout(() => {
        if (onPatientSaved) onPatientSaved(result);
        onClose();
      }, 1000);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save patient profile.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/80 text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {patientToEdit
                  ? "Update Patient Profile"
                  : "New Patient Registration"}
              </h2>
              <p className="text-xs text-slate-300">
                Enter personal, emergency contact, and insurance information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
              1. Personal Demographics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
              2. Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="patient@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Street Address, City, State, Zip"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contact */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
              3. Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  required
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  required
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="+1 (555) 999-9999"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Insurance Info */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
              4. Insurance Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  name="insurance_provider"
                  value={formData.insurance_provider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. BlueCross / Aetna"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy / Member ID
                </label>
                <input
                  type="text"
                  name="insurance_policy_number"
                  value={formData.insurance_policy_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. POL-99210"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>HIPAA Compliant PHI Storage</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {loading
                  ? "Saving..."
                  : patientToEdit
                    ? "Update Profile"
                    : "Register Patient"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientRegistrationModal;
