import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  User,
  Stethoscope,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Pill,
  ShieldCheck,
  Activity,
  Search,
} from "lucide-react";
import VitalsCard from "../components/consultations/VitalsCard";
import PrescriptionTable from "../components/consultations/PrescriptionTable";
import StatusBadge from "../components/common/StatusBadge";
import { appointmentsApi, clinicalApi } from "../services/api";

const COMMON_ICD10 = [
  { code: "I10", label: "I10 - Essential (primary) hypertension" },
  {
    code: "E11.9",
    label: "E11.9 - Type 2 diabetes mellitus without complications",
  },
  { code: "J02.9", label: "J02.9 - Acute pharyngitis, unspecified" },
  {
    code: "K21.9",
    label: "K21.9 - Gastro-esophageal reflux disease without esophagitis",
  },
  { code: "M54.5", label: "M54.5 - Low back pain, unspecified" },
  { code: "R05", label: "R05 - Cough" },
  { code: "J45.909", label: "J45.909 - Unspecified asthma, uncomplicated" },
  {
    code: "Z00.00",
    label:
      "Z00.00 - General adult medical examination without abnormal findings",
  },
];

const DEFAULT_APPOINTMENTS = [
  {
    id: "apt-default-1",
    appointment_code: "APT-2001",
    patient_id: "pat-1001",
    doctor_id: "doc-1",
    status: "IN_PROGRESS",
    reason_for_visit: "Hypertension follow-up & medication review",
    scheduled_start: "2026-06-01T10:00:00",
    scheduled_end: "2026-06-01T10:30:00",
    patient: {
      first_name: "John",
      last_name: "Doe",
      patient_code: "PAT-1001",
      date_of_birth: "1985-04-12",
      gender: "MALE",
      phone_number: "+1 (555) 234-5678",
      insurance_provider: "BlueCross Health",
    },
    doctor: {
      doctor_code: "DOC-101",
      department: "Cardiology",
      user: { full_name: "Dr. Marcus Smith" },
    },
  },
  {
    id: "apt-default-2",
    appointment_code: "APT-2002",
    patient_id: "pat-1002",
    doctor_id: "doc-2",
    status: "CONFIRMED",
    reason_for_visit: "Persistent migraine & neurological screening",
    scheduled_start: "2026-06-01T11:00:00",
    scheduled_end: "2026-06-01T11:30:00",
    patient: {
      first_name: "Sarah",
      last_name: "Connor",
      patient_code: "PAT-1002",
      date_of_birth: "1990-08-22",
      gender: "FEMALE",
      phone_number: "+1 (555) 345-6789",
      insurance_provider: "Aetna Choice",
    },
    doctor: {
      doctor_code: "DOC-102",
      department: "Neurology",
      user: { full_name: "Dr. Elena Vance" },
    },
  },
];

export function ConsultationsPage() {
  const [searchParams] = useSearchParams();
  const queryAppointmentId = searchParams.get("appointmentId");

  const [appointments, setAppointments] = useState(DEFAULT_APPOINTMENTS);
  const [selectedAppointment, setSelectedAppointment] = useState(
    DEFAULT_APPOINTMENTS[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clinical record form state
  const [symptoms, setSymptoms] = useState(
    "Patient reports mild headache and elevated blood pressure over the past 2 weeks.",
  );
  const [diagnosis, setDiagnosis] = useState(
    "I10 - Essential (primary) hypertension",
  );
  const [notes, setNotes] = useState(
    "Recommended low-sodium diet, moderate aerobic exercise 30 mins daily, and follow-up in 4 weeks.",
  );
  const [followUpDate, setFollowUpDate] = useState("2026-07-01");
  const [vitals, setVitals] = useState({
    blood_pressure: "138/88 mmHg",
    heart_rate: "76 bpm",
    temperature: "98.6 °F",
    oxygen_saturation: "99%",
  });
  const [prescriptions, setPrescriptions] = useState([
    {
      drug_name: "Amlodipine 5mg",
      dosage: "1 tablet",
      frequency: "Once daily in the morning",
      duration: "30 days",
      instructions: "Take with or without food",
    },
  ]);

  const [pastRecords, setPastRecords] = useState([]);
  const [savingRecord, setSavingRecord] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const loadAppointmentsAndContext = async () => {
    try {
      const data = await appointmentsApi.list({ limit: 50 });
      if (data && data.length > 0) {
        setAppointments(data);
        let targetApt = null;
        if (queryAppointmentId) {
          targetApt = data.find(
            (a) =>
              a.id === queryAppointmentId ||
              a.appointment_code === queryAppointmentId,
          );
        }
        if (!targetApt) targetApt = data[0];
        setSelectedAppointment(targetApt);
        if (targetApt) fetchPastRecords(targetApt.id);
      }
    } catch {
      // Keep rich default state if backend not reached
    }
  };

  const fetchPastRecords = async (appointmentId) => {
    try {
      const records = await clinicalApi.getRecords(appointmentId);
      setPastRecords(records || []);
    } catch {
      setPastRecords([]);
    }
  };

  useEffect(() => {
    loadAppointmentsAndContext();
  }, [queryAppointmentId]);

  const handleSelectAppointment = (apt) => {
    setSelectedAppointment(apt);
    setSaveSuccess(null);
    setSaveError(null);
    if (apt) {
      fetchPastRecords(apt.id);
    }
  };

  const handleSaveEMR = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) {
      setSaveError("Please select an active appointment encounter.");
      return;
    }

    setSavingRecord(true);
    setSaveError(null);
    setSaveSuccess(null);

    const prescriptionPayload = JSON.stringify({
      vitals,
      medications: prescriptions,
    });

    const payload = {
      appointment_id: selectedAppointment.id,
      patient_id: selectedAppointment.patient_id,
      doctor_id: selectedAppointment.doctor_id,
      symptoms,
      diagnosis,
      prescription: prescriptionPayload,
      notes,
      follow_up_date: followUpDate || null,
    };

    try {
      await clinicalApi.createRecord(selectedAppointment.id, payload);
      // Transition appointment status to COMPLETED
      await appointmentsApi.updateStatus(selectedAppointment.id, "COMPLETED");

      setSaveSuccess(
        "Clinical consultation record saved & encounter marked as COMPLETED.",
      );
      fetchPastRecords(selectedAppointment.id);
      setSelectedAppointment((prev) =>
        prev ? { ...prev, status: "COMPLETED" } : prev,
      );
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save clinical consultation record.";
      setSaveError(detail);
    } finally {
      setSavingRecord(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
              CarePulse Doctor EMR
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Confidential Doctor Notes & e-Prescribe
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Clinical Consultation Workspace & EMR
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record clinical vitals, ICD-10 medical diagnoses, digital
            prescriptions, and encounter notes.
          </p>
        </div>

        {/* Appointment Encounter Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Active Encounter:
          </label>
          <select
            value={selectedAppointment?.id || ""}
            onChange={(e) => {
              const apt = appointments.find((a) => a.id === e.target.value);
              if (apt) handleSelectAppointment(apt);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.appointment_code || a.id.slice(0, 8)} —{" "}
                {a.patient
                  ? `${a.patient.first_name} ${a.patient.last_name}`
                  : "Patient"}{" "}
                ({a.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedAppointment && (
        <form onSubmit={handleSaveEMR} className="space-y-6">
          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Patient Context & Vitals (1 col) */}
            <div className="space-y-6">
              {/* Patient Profile Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {selectedAppointment.patient
                          ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}`
                          : "John Doe"}
                      </h3>
                      <span className="text-[11px] font-mono text-indigo-600 block">
                        {selectedAppointment.patient?.patient_code ||
                          "PAT-1001"}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={selectedAppointment.status} />
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">DOB & Gender:</span>
                    <span className="font-medium text-slate-800">
                      {selectedAppointment.patient?.date_of_birth ||
                        "1985-04-12"}{" "}
                      ({selectedAppointment.patient?.gender || "MALE"})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Insurance Provider:</span>
                    <span className="font-medium text-slate-800">
                      {selectedAppointment.patient?.insurance_provider ||
                        "BlueCross Health"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Encounter Code:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedAppointment.appointment_code || "APT-2001"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Attending Physician:</span>
                    <span className="font-semibold text-indigo-600">
                      {selectedAppointment.doctor?.user?.full_name ||
                        "Dr. Marcus Smith"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    Chief Complaint:
                  </span>
                  <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                    "
                    {selectedAppointment.reason_for_visit ||
                      "Hypertension follow-up & routine consultation"}
                    "
                  </p>
                </div>
              </div>

              {/* Vitals Card */}
              <VitalsCard vitals={vitals} onChange={(v) => setVitals(v)} />
            </div>

            {/* Right Column: Clinical Findings, Diagnosis & Prescriptions (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Clinical Symptoms & ICD-10 Diagnosis */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Clinical Examination & ICD-10 Diagnosis
                  </h3>
                </div>

                {/* Symptoms Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observed Symptoms & Subjective Findings *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Enter clinical symptoms, onset duration, severity, and examination findings..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* ICD-10 Diagnosis Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ICD-10 Medical Diagnosis Code & Description *
                  </label>
                  <select
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                  >
                    {COMMON_ICD10.map((item) => (
                      <option key={item.code} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prescription Table Component */}
              <PrescriptionTable
                prescriptions={prescriptions}
                onChange={(p) => setPrescriptions(p)}
              />

              {/* Doctor Clinical Notes & Follow-up */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Confidential Physician Notes & Care Plan
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor Clinical Notes & Recommendations
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Doctor recommendations, lifestyle modifications, care instructions..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Finalize Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      EMR record will be permanently committed to patient file
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={savingRecord}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingRecord
                      ? "Finalizing EMR Record..."
                      : "Complete Encounter & Save EMR"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default ConsultationsPage;
