import React, { useState, useEffect } from "react";
import {
  User,
  Heart,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Phone,
  Home,
} from "lucide-react";
import { patientApi } from "../services/api";

export default function RegistrationStepperForm({
  isOpen,
  onClose,
  onSuccess,
  existingPatients = [],
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const initialFormData = {
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "MALE",
    national_id: "",
    phone: "",
    address: "",
    emergency_contact: {
      name: "",
      relationship: "Spouse",
      phone: "",
    },
    insurance_info: {
      provider: "Blue Cross Blue Shield",
      policy_number: "",
      group_number: "",
      blood_type: "O+",
      allergies: "None",
    },
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrorMessage("");
      setDuplicateWarning(null);
      setFormData(initialFormData);
    }
  }, [isOpen]);

  // Real-time duplicate SSN / National ID check
  const handleNationalIdChange = (value) => {
    setFormData((prev) => ({ ...prev, national_id: value }));

    if (value.trim().length >= 4) {
      const match = existingPatients.find(
        (p) =>
          String(p.national_id || "").toLowerCase() ===
          value.trim().toLowerCase(),
      );
      if (match) {
        setDuplicateWarning(
          `Existing Patient Profile Detected: ${match.first_name} ${match.last_name} (MRN: ${String(match.id).slice(0, 8)}) is already registered with SSN/ID ${value}.`,
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleNext = (e) => {
    e?.preventDefault();
    if (currentStep === 1) {
      if (
        !formData.first_name ||
        !formData.last_name ||
        !formData.national_id
      ) {
        setErrorMessage("Please complete all required demographic fields.");
        return;
      }
    }
    setErrorMessage("");
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setErrorMessage("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || "1990-01-01",
        gender: formData.gender,
        national_id: formData.national_id,
        phone: formData.phone,
        address: formData.address,
        emergency_contact: formData.emergency_contact,
        insurance_info: formData.insurance_info,
      };

      const result = await patientApi.createPatient(payload);
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to register patient profile. Please verify data and retry.";
      setErrorMessage(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-sky-400" />
              Patient Registration & Intake
            </h2>
            <p className="text-xs text-slate-400">
              Master Patient Index (MPI) Demographic Enrollment
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Tabs Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep >= 1
                  ? "bg-sky-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              1
            </span>
            <span
              className={`text-xs font-semibold ${
                currentStep === 1 ? "text-sky-700" : "text-slate-500"
              }`}
            >
              Demographics
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep >= 2
                  ? "bg-sky-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span
              className={`text-xs font-semibold ${
                currentStep === 2 ? "text-sky-700" : "text-slate-500"
              }`}
            >
              Emergency Contact
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep === 3
                  ? "bg-sky-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </span>
            <span
              className={`text-xs font-semibold ${
                currentStep === 3 ? "text-sky-700" : "text-slate-500"
              }`}
            >
              Insurance & Medical
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={currentStep === 3 ? handleSubmit : handleNext}
          className="p-6"
        >
          {/* Duplicate SSN Warning Banner */}
          {duplicateWarning && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Duplicate Identity Warning</p>
                <p>{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Demographics */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={formData.first_name}
                    onChange={(e) =>
                      handleChange(null, "first_name", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleChange(null, "last_name", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      handleChange(null, "date_of_birth", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      handleChange(null, "gender", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SSN / National ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123-45-6789"
                    value={formData.national_id}
                    onChange={(e) => handleNationalIdChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) =>
                      handleChange(null, "phone", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace, Springfield"
                  value={formData.address}
                  onChange={(e) =>
                    handleChange(null, "address", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Emergency Contact */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
                <Heart className="h-4 w-4 text-teal-600 shrink-0" />
                <span>
                  Designate a primary contact for clinical emergencies and
                  notifications.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact Full Name{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={formData.emergency_contact.name}
                  onChange={(e) =>
                    handleChange("emergency_contact", "name", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={formData.emergency_contact.relationship}
                    onChange={(e) =>
                      handleChange(
                        "emergency_contact",
                        "relationship",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emergency Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (555) 987-6543"
                    value={formData.emergency_contact.phone}
                    onChange={(e) =>
                      handleChange("emergency_contact", "phone", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Insurance & Health */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aetna / Blue Cross / Medicare"
                    value={formData.insurance_info.provider}
                    onChange={(e) =>
                      handleChange("insurance_info", "provider", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Policy / Member ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INS-12345678"
                    value={formData.insurance_info.policy_number}
                    onChange={(e) =>
                      handleChange(
                        "insurance_info",
                        "policy_number",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Blood Type
                  </label>
                  <select
                    value={formData.insurance_info.blood_type}
                    onChange={(e) =>
                      handleChange(
                        "insurance_info",
                        "blood_type",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-rose-600"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Allergies & Clinical Warnings
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Latex, NSAIDs"
                    value={formData.insurance_info.allergies}
                    onChange={(e) =>
                      handleChange(
                        "insurance_info",
                        "allergies",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-rose-700 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Controls / Navigation Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>Enrolling Patient...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete Enrollment</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
