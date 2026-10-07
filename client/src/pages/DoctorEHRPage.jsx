import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PatientBanner from "../components/doctor/PatientBanner";
import EHRConsultationForm from "../components/doctor/EHRConsultationForm";
import EHRTimeline from "../components/doctor/EHRTimeline";
import {
  Stethoscope,
  HeartPulse,
  Clock,
  ShieldAlert,
  Search,
  UserCheck,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

export const DoctorEHRPage = () => {
  const { user, switchRole } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState("pat-9921");
  const [activeTab, setActiveTab] = useState("encounter"); // 'encounter' | 'history'
  const [refreshHistory, setRefreshHistory] = useState(0);

  const availablePatients = [
    {
      id: "pat-9921",
      full_name: "Eleanor Vance",
      national_id: "***-**-4912",
      date_of_birth: "1984-06-14",
      gender: "Female",
      blood_group: "A+",
      allergies: ["Penicillin (Anaphylaxis)", "Sulfa Drugs (Rash)"],
      emergency_contact_name: "Arthur Vance (Spouse)",
      emergency_contact_phone: "+1 (555) 782-1920",
      insurance_provider: "Aetna Health HMO",
      insurance_policy_number: "AET-88310-99",
    },
    {
      id: "pat-1002",
      full_name: "Marcus Holloway",
      national_id: "***-**-8821",
      date_of_birth: "1992-11-03",
      gender: "Male",
      blood_group: "O-",
      allergies: ["Latex Sensitivity"],
      emergency_contact_name: "Regina Holloway",
      emergency_contact_phone: "+1 (555) 432-8819",
      insurance_provider: "BlueCross BlueShield",
      insurance_policy_number: "BCBS-11209-US",
    },
    {
      id: "pat-1003",
      full_name: "Sophia Chen",
      national_id: "***-**-3341",
      date_of_birth: "1979-02-21",
      gender: "Female",
      blood_group: "B+",
      allergies: ["Aspirin (GI Bleed)"],
      emergency_contact_name: "David Chen",
      emergency_contact_phone: "+1 (555) 221-9031",
      insurance_provider: "UnitedHealthcare",
      insurance_policy_number: "UHC-44910-CA",
    },
  ];

  const currentPatient =
    availablePatients.find((p) => p.id === selectedPatientId) ||
    availablePatients[0];

  const isPhysicianRole = user?.role === "DOCTOR" || user?.role === "ADMIN";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Role Notice & Doctor Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-600 rounded-xl shadow-inner text-white">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                Physician Clinical &amp; EHR Workspace
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Clinical Mode
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Attending:{" "}
              <strong>{user?.full_name || "Dr. Sarah Smith, MD"}</strong> &bull;
              Department: Cardiology
            </p>
          </div>
        </div>

        {/* Patient Switcher in Clinical Workspace */}
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-sky-400" /> Active Patient:
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-slate-900 text-sky-300 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-sky-400"
          >
            {availablePatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RBAC Guard Notice if User is Patient */}
      {!isPhysicianRole && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Simulated Clinical Staff Mode</p>
              <p>
                You are currently logged in as <strong>{user?.role}</strong>.
                For demonstration, you can view and test the Physician EHR
                Workspace, or switch to Doctor role.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchRole("DOCTOR")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs whitespace-nowrap"
          >
            Switch to Doctor Role
          </button>
        </div>
      )}

      {/* Patient Demographic Banner & Allergy Alert Pills */}
      <PatientBanner patient={currentPatient} />

      {/* Clinical Workspace Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("encounter")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "encounter"
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Current Consultation Encounter (SOAP)
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "history"
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          Longitudinal Medical History
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "encounter" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <EHRConsultationForm
              patientId={currentPatient.id}
              onRecordCreated={() => setRefreshHistory((prev) => prev + 1)}
            />
          </div>
          <div className="lg:col-span-4">
            <EHRTimeline key={refreshHistory} />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl">
          <EHRTimeline key={refreshHistory} />
        </div>
      )}
    </div>
  );
};

export default DoctorEHRPage;
