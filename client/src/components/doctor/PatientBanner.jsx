import React from "react";
import {
  User,
  AlertOctagon,
  Heart,
  Shield,
  Activity,
  Phone,
  FileBadge,
} from "lucide-react";
import Badge from "../common/Badge";

export const PatientBanner = ({ patient }) => {
  const defaultPatient = {
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
  };

  const p = patient || defaultPatient;

  // Calculate age
  const calculateAge = (dob) => {
    if (!dob) return "40";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Patient Profile Details */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
            {p.full_name?.charAt(0) || "P"}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-white">{p.full_name}</h2>
              <span className="font-mono text-xs text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                MRN: {p.id || "PAT-001"}
              </span>
              <Badge variant="primary">{p.gender}</Badge>
              <span className="text-xs text-slate-300">
                {calculateAge(p.date_of_birth)} yrs (DOB:{" "}
                {p.date_of_birth || "1984-06-14"})
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  Blood:{" "}
                  <strong className="text-white">
                    {p.blood_group || "O+"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Emergency: {p.emergency_contact_name || "Arthur Vance"} (
                  {p.emergency_contact_phone || "+1 555-782-1920"})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Insurance: {p.insurance_provider || "Aetna"} (#
                  {p.insurance_policy_number || "AET-88310"})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Red Allergy Alert Pills */}
        <div className="bg-slate-800/90 p-3 rounded-xl border border-rose-900/40 flex flex-col gap-1.5 shrink-0 max-w-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>CRITICAL ALLERGIES &amp; ALERTS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(p.allergies || ["Penicillin", "Sulfa Drugs"]).map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1 bg-rose-950/90 text-rose-300 border border-rose-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBanner;
