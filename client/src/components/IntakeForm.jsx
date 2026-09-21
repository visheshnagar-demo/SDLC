import React, { useState } from "react";
import {
  UserPlus,
  AlertTriangle,
  Shield,
  CheckCircle,
  Package,
  FileText,
} from "lucide-react";
import DuplicateAlertBanner from "./DuplicateAlertBanner.jsx";

export default function IntakeForm({ onSubmitInmate }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "1990-05-15",
    ssn: "",
    gender: "Male",
    security_level: "Medium",
    gang_affiliation: "None",
    medical_alerts: "Asthma, Penicillin Allergy",
    charges: "Possession with Intent, Disorderly Conduct",
    property_items: "Wallet, Silver Watch, iPhone 13, Keyring",
  });

  const [duplicateInmate, setDuplicateInmate] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Mock duplicate SSN trigger for demonstration/testing
    if (name === "ssn" && value.endsWith("9999")) {
      setDuplicateInmate({
        first_name: "John",
        last_name: "Doe",
        booking_number: "BK-2026-0042",
        ssn: value,
      });
    } else if (name === "ssn" && duplicateInmate) {
      setDuplicateInmate(null);
    }
  };

  const fillTestData = () => {
    setFormData({
      first_name: "Marcus",
      last_name: "Vance",
      date_of_birth: "1992-08-24",
      ssn: "123-45-6789",
      gender: "Male",
      security_level: "Maximum",
      gang_affiliation: "Northside Syndicate",
      medical_alerts: "Diabetic - Requires Insulin at 0800",
      charges: "Armed Robbery, Evading Arrest",
      property_items: "Black Leather Wallet, Gold Chain, Samsung Galaxy S22",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ loading: true, error: null, success: false });

    try {
      if (onSubmitInmate) {
        await onSubmitInmate(formData);
      }
      setSubmitStatus({ loading: false, error: null, success: true });
      // Reset after success
      setTimeout(() => {
        setSubmitStatus((s) => ({ ...s, success: false }));
      }, 3000);
    } catch (err) {
      setSubmitStatus({
        loading: false,
        error:
          err.response?.data?.detail ||
          err.message ||
          "Failed to submit intake record.",
        success: false,
      });
    }
  };

  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 shadow-xl text-[#F8FAFC]">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#334155]">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#2563EB]">
            <UserPlus className="w-5 h-5" /> Inmate Booking & Intake
            Registration
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Capture demographics, risk classification, charges, and property
            inventory
          </p>
        </div>
        <button
          type="button"
          onClick={fillTestData}
          className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border border-[#38BDF8]/30 rounded text-xs font-semibold transition-colors"
        >
          Autofill Test Data
        </button>
      </div>

      <DuplicateAlertBanner
        duplicateInmate={duplicateInmate}
        onDismiss={() => setDuplicateInmate(null)}
        onProceedAnyway={() => setDuplicateInmate(null)}
      />

      {submitStatus.success && (
        <div className="mb-6 p-4 bg-[#064E3B] border border-[#10B981] text-[#10B981] rounded-lg flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="w-5 h-5" /> Inmate Intake Record successfully
          processed & logged to audit trail.
        </div>
      )}

      {submitStatus.error && (
        <div className="mb-6 p-4 bg-[#7F1D1D] border border-[#EF4444] text-[#FCA5A5] rounded-lg flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5" /> {submitStatus.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="first_name"
              required
              value={formData.first_name}
              onChange={handleChange}
              placeholder="e.g. Marcus"
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="last_name"
              required
              value={formData.last_name}
              onChange={handleChange}
              placeholder="e.g. Vance"
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              name="date_of_birth"
              required
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              SSN / National ID (Type ...9999 for duplicate test) *
            </label>
            <input
              type="text"
              name="ssn"
              required
              value={formData.ssn}
              onChange={handleChange}
              placeholder="XXX-XX-XXXX"
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
              Security Classification Level *
            </label>
            <select
              name="security_level"
              value={formData.security_level}
              onChange={handleChange}
              className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="Minimum">Minimum Security</option>
              <option value="Medium">Medium Security</option>
              <option value="Maximum">Maximum Security</option>
              <option value="Administrative Isolation">
                Administrative Isolation
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1">
            Gang Affiliation / Rival Group
          </label>
          <input
            type="text"
            name="gang_affiliation"
            value={formData.gang_affiliation}
            onChange={handleChange}
            placeholder="e.g. Northside Syndicate, None, Unaffiliated"
            className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1 flex items-center gap-1 text-[#F59E0B]">
            <AlertTriangle className="w-3.5 h-3.5" /> Medical Intake Alerts &
            Allergies
          </label>
          <textarea
            name="medical_alerts"
            rows="2"
            value={formData.medical_alerts}
            onChange={handleChange}
            placeholder="e.g. Diabetic, Asthma, Suicide Watch, Medical Isolation"
            className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-[#38BDF8]" /> Active Charges &
            Warrant Details
          </label>
          <textarea
            name="charges"
            rows="2"
            value={formData.charges}
            onChange={handleChange}
            placeholder="e.g. Aggravated Assault, Possession"
            className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-[#38BDF8]" /> Inmate Property
            Inventory
          </label>
          <input
            type="text"
            name="property_items"
            value={formData.property_items}
            onChange={handleChange}
            placeholder="e.g. Wallet, Watch, Cellphone, Keys"
            className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitStatus.loading}
            className="w-full py-3 bg-[#2563EB] hover:bg-blue-600 disabled:bg-blue-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {submitStatus.loading
              ? "Processing Booking..."
              : "Complete Inmate Booking & Log Record"}
          </button>
        </div>
      </form>
    </div>
  );
}
