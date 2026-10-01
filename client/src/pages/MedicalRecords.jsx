import React, { useState, useEffect } from "react";
import { FileText, Users, Activity, AlertCircle } from "lucide-react";
import PatientBanner from "../components/PatientBanner";
import EmrWorkspace from "../components/EmrWorkspace";
import { patientApi } from "../services/api";

export default function MedicalRecords({
  selectedPatient,
  onSelectPatient,
  currentUser,
}) {
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(selectedPatient);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      setActivePatient(selectedPatient);
    }
  }, [selectedPatient]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientApi.getPatients();
      if (Array.isArray(data) && data.length > 0) {
        setPatients(data);
        if (!activePatient) {
          setActivePatient(data[0]);
        }
      } else {
        // Fallback default patients
        const defaultList = [
          {
            id: "p-101",
            first_name: "Eleanor",
            last_name: "Pena",
            date_of_birth: "1985-06-14",
            gender: "FEMALE",
            national_id: "987-65-4321",
            phone: "+1 (555) 382-9102",
            address: "123 Elm Street, Springfield",
            emergency_contact: {
              name: "Mark Pena",
              relationship: "Spouse",
              phone: "+1 (555) 998-1234",
            },
            insurance_info: {
              provider: "Blue Cross Blue Shield",
              policy_number: "INS-99482",
              allergies: "Penicillin (Anaphylaxis Risk)",
              blood_type: "O+",
            },
          },
          {
            id: "p-102",
            first_name: "Robert",
            last_name: "Fox",
            date_of_birth: "1972-11-03",
            gender: "MALE",
            national_id: "456-78-1234",
            phone: "+1 (555) 720-1945",
            address: "456 Oak Avenue, Springfield",
            emergency_contact: {
              name: "Lisa Fox",
              relationship: "Spouse",
              phone: "+1 (555) 720-9988",
            },
            insurance_info: {
              provider: "Medicare Advantage",
              policy_number: "MED-88124",
              allergies: "Sulfa Drugs",
              blood_type: "A+",
            },
          },
        ];
        setPatients(defaultList);
        if (!activePatient) {
          setActivePatient(defaultList[0]);
        }
      }
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (patientId) => {
    const found = patients.find((p) => p.id === patientId);
    if (found) {
      setActivePatient(found);
      if (onSelectPatient) onSelectPatient(found);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Patient Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-sky-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Electronic Medical Records (EMR) &amp; Clinical Notes
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            SOAP documentation workspace, immutable sign-off seal, signed
            addendums, and prescription management.
          </p>
        </div>

        {/* Patient Quick Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">
            Active Patient:
          </label>
          <select
            value={activePatient?.id || ""}
            onChange={(e) => handlePatientChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} (MRN: {String(p.id).slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* High-Contrast Clinical Alert Banner */}
      <PatientBanner
        patient={activePatient}
        onClearPatient={() => setActivePatient(null)}
      />

      {/* EMR Two-Pane Clinical Workspace */}
      <EmrWorkspace patient={activePatient} currentUser={currentUser} />
    </div>
  );
}
