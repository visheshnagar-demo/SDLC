import React, { useState } from "react";
import { ehrApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  HeartPulse,
  Activity,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Stethoscope,
  Pill,
  Microscope,
} from "lucide-react";

export const EHRConsultationForm = ({ patientId, onRecordCreated }) => {
  const { user } = useAuth();

  const [vitals, setVitals] = useState({
    bp_systolic: 124,
    bp_diastolic: 82,
    heart_rate: 76,
    spo2: 99,
    temperature: 98.4,
    resp_rate: 16,
    weight_kg: 68.5,
  });

  const [soapNotes, setSoapNotes] = useState({
    subjective:
      "Patient presents with intermittent mild tension headaches and occasional dizziness over past 2 weeks.",
    objective:
      "Alert, oriented x3. Normal S1/S2 heart sounds. Chest clear to auscultation bilaterally. No peripheral edema.",
    assessment:
      "Primary mild hypertension with tension-type headache. Likely exacerbated by occupational stress.",
    plan: "Initiate lifestyle modifications (DASH diet, aerobic exercise). Prescribe low-dose ACE inhibitor. Order routine metabolic lab panel.",
  });

  const [selectedIcd, setSelectedIcd] = useState(
    "I10 - Essential (primary) hypertension",
  );

  const icd10Options = [
    "I10 - Essential (primary) hypertension",
    "E11.9 - Type 2 diabetes mellitus without complications",
    "J06.9 - Acute upper respiratory infection",
    "M54.5 - Low back pain, unspecified",
    "K21.9 - Gastro-esophageal reflux disease without esophagitis",
    "F41.1 - Generalized anxiety disorder",
    "R05 - Cough, unspecified",
  ];

  const [prescriptions, setPrescriptions] = useState([
    {
      medication: "Lisinopril",
      dosage: "10 mg",
      frequency: "Once Daily (Morning)",
      duration: "30 Days",
      instructions: "Take with full glass of water. Monitor BP.",
    },
    {
      medication: "Acetaminophen",
      dosage: "500 mg",
      frequency: "PRN every 6 hours",
      duration: "5 Days",
      instructions: "For acute headache relief. Do not exceed 3000mg/day.",
    },
  ]);

  const [labOrders, setLabOrders] = useState([
    {
      test_name: "Comprehensive Metabolic Panel (CMP)",
      priority: "Routine",
      indication: "Baseline renal & electrolyte evaluation",
    },
    {
      test_name: "Lipid Profile Fasting",
      priority: "Routine",
      indication: "Cardiovascular risk stratification",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Vitals Handler
  const handleVitalChange = (field, val) => {
    setVitals((prev) => ({ ...prev, [field]: val }));
  };

  // Prescription Handlers
  const addPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        medication: "",
        dosage: "10 mg",
        frequency: "Daily",
        duration: "14 Days",
        instructions: "Take after meals",
      },
    ]);
  };

  const removePrescription = (idx) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRxChange = (idx, field, val) => {
    setPrescriptions((prev) =>
      prev.map((rx, i) => (i === idx ? { ...rx, [field]: val } : rx)),
    );
  };

  // Lab Order Handlers
  const addLabOrder = () => {
    setLabOrders((prev) => [
      ...prev,
      {
        test_name: "",
        priority: "Routine",
        indication: "Diagnostic evaluation",
      },
    ]);
  };

  const removeLabOrder = (idx) => {
    setLabOrders((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLabChange = (idx, field, val) => {
    setLabOrders((prev) =>
      prev.map((lab, i) => (i === idx ? { ...lab, [field]: val } : lab)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const recordPayload = {
      patient_id: patientId || "pat-9921",
      doctor_id: user?.id || "doc-001",
      appointment_id: "apt-001",
      diagnosis: selectedIcd,
      clinical_notes: `SOAP ENCOUNTER:\nS: ${soapNotes.subjective}\nO: ${soapNotes.objective}\nA: ${soapNotes.assessment}\nP: ${soapNotes.plan}\nVitals: BP ${vitals.bp_systolic}/${vitals.bp_diastolic}, HR ${vitals.heart_rate}, SpO2 ${vitals.spo2}%, Temp ${vitals.temperature}F`,
      prescriptions: prescriptions,
      lab_orders: labOrders,
    };

    try {
      const res = await ehrApi.createRecord(recordPayload);
      setSuccess(true);
      if (onRecordCreated) onRecordCreated(res || recordPayload);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      // If server error or mock mode, keep resilient behavior without pretending false success
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save clinical encounter to EHR backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
      {/* Vitals Monitor Strip */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Point-of-Care Vitals Monitor Strip
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Telemetry Synchronized
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <label className="block text-[10px] text-slate-400 uppercase font-semibold">
              BP (mmHg)
            </label>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={vitals.bp_systolic}
                onChange={(e) =>
                  handleVitalChange("bp_systolic", Number(e.target.value))
                }
                className="w-12 bg-slate-900 border border-slate-600 rounded px-1.5 py-1 text-center font-bold text-white"
              />
              <span className="text-slate-500">/</span>
              <input
                type="number"
                value={vitals.bp_diastolic}
                onChange={(e) =>
                  handleVitalChange("bp_diastolic", Number(e.target.value))
                }
                className="w-12 bg-slate-900 border border-slate-600 rounded px-1.5 py-1 text-center font-bold text-white"
              />
            </div>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <label className="block text-[10px] text-slate-400 uppercase font-semibold">
              Heart Rate (bpm)
            </label>
            <input
              type="number"
              value={vitals.heart_rate}
              onChange={(e) =>
                handleVitalChange("heart_rate", Number(e.target.value))
              }
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 font-bold text-white mt-1"
            />
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <label className="block text-[10px] text-slate-400 uppercase font-semibold">
              SpO2 (%)
            </label>
            <input
              type="number"
              value={vitals.spo2}
              onChange={(e) =>
                handleVitalChange("spo2", Number(e.target.value))
              }
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 font-bold text-sky-400 mt-1"
            />
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <label className="block text-[10px] text-slate-400 uppercase font-semibold">
              Temp (&deg;F)
            </label>
            <input
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) =>
                handleVitalChange("temperature", Number(e.target.value))
              }
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 font-bold text-amber-400 mt-1"
            />
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <label className="block text-[10px] text-slate-400 uppercase font-semibold">
              Resp (bpm)
            </label>
            <input
              type="number"
              value={vitals.resp_rate}
              onChange={(e) =>
                handleVitalChange("resp_rate", Number(e.target.value))
              }
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 font-bold text-white mt-1"
            />
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <label className="block text-[10px] text-slate-400 uppercase font-semibold">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={vitals.weight_kg}
              onChange={(e) =>
                handleVitalChange("weight_kg", Number(e.target.value))
              }
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 font-bold text-white mt-1"
            />
          </div>
        </div>
      </div>

      {/* SOAP Notes Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Stethoscope className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Physician SOAP Encounter Notes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              <span className="text-sky-600 font-mono mr-1">S:</span> Subjective
              (History &amp; Symptoms)
            </label>
            <textarea
              rows={3}
              value={soapNotes.subjective}
              onChange={(e) =>
                setSoapNotes((prev) => ({
                  ...prev,
                  subjective: e.target.value,
                }))
              }
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              <span className="text-sky-600 font-mono mr-1">O:</span> Objective
              (Physical Examination)
            </label>
            <textarea
              rows={3}
              value={soapNotes.objective}
              onChange={(e) =>
                setSoapNotes((prev) => ({ ...prev, objective: e.target.value }))
              }
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              <span className="text-sky-600 font-mono mr-1">A:</span> Assessment
              &amp; Clinical Impression
            </label>
            <textarea
              rows={3}
              value={soapNotes.assessment}
              onChange={(e) =>
                setSoapNotes((prev) => ({
                  ...prev,
                  assessment: e.target.value,
                }))
              }
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              <span className="text-sky-600 font-mono mr-1">P:</span> Plan &amp;
              Interventions
            </label>
            <textarea
              rows={3}
              value={soapNotes.plan}
              onChange={(e) =>
                setSoapNotes((prev) => ({ ...prev, plan: e.target.value }))
              }
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
        </div>

        {/* ICD-10 Diagnosis Selector */}
        <div className="pt-2">
          <label className="block font-bold text-slate-800 mb-1">
            Primary ICD-10 Clinical Diagnosis
          </label>
          <select
            value={selectedIcd}
            onChange={(e) => setSelectedIcd(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
          >
            {icd10Options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* E-Prescription Builder */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              E-Prescription Order Builder
            </h3>
          </div>
          <button
            type="button"
            onClick={addPrescription}
            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Medication
          </button>
        </div>

        <div className="space-y-3">
          {prescriptions.map((rx, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center"
            >
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={rx.medication}
                  onChange={(e) =>
                    handleRxChange(idx, "medication", e.target.value)
                  }
                  placeholder="Medication Name"
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={rx.dosage}
                  onChange={(e) =>
                    handleRxChange(idx, "dosage", e.target.value)
                  }
                  placeholder="Dosage (e.g. 10mg)"
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={rx.frequency}
                  onChange={(e) =>
                    handleRxChange(idx, "frequency", e.target.value)
                  }
                  placeholder="Frequency (e.g. BID)"
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                  required
                />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={rx.duration}
                  onChange={(e) =>
                    handleRxChange(idx, "duration", e.target.value)
                  }
                  placeholder="Duration (14d)"
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => removePrescription(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                  title="Remove Rx"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lab Orders Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Diagnostic Laboratory Orders
            </h3>
          </div>
          <button
            type="button"
            onClick={addLabOrder}
            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Lab Test
          </button>
        </div>

        <div className="space-y-3">
          {labOrders.map((lab, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
            >
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={lab.test_name}
                  onChange={(e) =>
                    handleLabChange(idx, "test_name", e.target.value)
                  }
                  placeholder="Lab Test Name"
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                  required
                />
              </div>
              <div>
                <select
                  value={lab.priority}
                  onChange={(e) =>
                    handleLabChange(idx, "priority", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="STAT">STAT / Emergency</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={lab.indication}
                  onChange={(e) =>
                    handleLabChange(idx, "indication", e.target.value)
                  }
                  placeholder="Clinical Indication"
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeLabOrder(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                  title="Remove Lab"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            EHR Encounter, SOAP notes, prescriptions &amp; lab orders securely
            saved and audit logged.
          </span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading
            ? "Encrypting & Saving EHR..."
            : "Save & Finalize Clinical Encounter"}
        </button>
      </div>
    </form>
  );
};

export default EHRConsultationForm;
