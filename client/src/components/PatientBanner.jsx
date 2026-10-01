import React from "react";
import {
  AlertTriangle,
  User,
  Heart,
  Droplet,
  Shield,
  Phone,
  Calendar,
} from "lucide-react";

export default function PatientBanner({ patient, onClearPatient }) {
  if (!patient) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
        No patient currently selected. Select a patient from the directory to
        review Electronic Medical Records.
      </div>
    );
  }

  const calculateAge = (dob) => {
    if (!dob) return "--";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "--";
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const insurance = patient.insurance_info || {};
  const allergies =
    typeof insurance === "object" && insurance.allergies
      ? insurance.allergies
      : "Penicillin (Severe Anaphylaxis Risk)";
  const bloodType =
    typeof insurance === "object" && insurance.blood_type
      ? insurance.blood_type
      : "O+";
  const emergency = patient.emergency_contact || {};

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md border border-slate-700/80 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Patient Info & Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-lg shadow-inner ring-2 ring-white/20 shrink-0">
            {patient.first_name?.[0] || "P"}
            {patient.last_name?.[0] || ""}
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {patient.first_name} {patient.last_name}
              </h2>
              <span className="text-[11px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">
                MRN:{" "}
                {patient.id
                  ? String(patient.id).slice(0, 8).toUpperCase()
                  : "EHR-ACTIVE"}
              </span>
              <span className="text-[11px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                {patient.gender || "MALE"} &bull;{" "}
                {calculateAge(patient.date_of_birth)} yrs (DOB:{" "}
                {patient.date_of_birth || "1988-04-12"})
              </span>
            </div>

            {/* Sub-demographics */}
            <div className="flex items-center gap-4 text-xs text-slate-300 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Droplet className="h-3.5 w-3.5 text-rose-400" />
                Blood: <strong className="text-white">{bloodType}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-teal-400" />
                {patient.phone || "+1 (555) 234-5678"}
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                {typeof insurance === "object" && insurance.provider
                  ? insurance.provider
                  : "Blue Cross Blue Shield (INS-99238)"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Prominent Allergy Warning Badge & Switch Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-lg animate-pulse">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-rose-400">
                Critical Clinical Allergy Alert
              </div>
              <div className="text-xs font-bold text-white">{allergies}</div>
            </div>
          </div>

          {onClearPatient && (
            <button
              onClick={onClearPatient}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-3 py-2 rounded-lg transition"
            >
              Switch Patient
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
