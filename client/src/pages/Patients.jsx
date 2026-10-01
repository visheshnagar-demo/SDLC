import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, RefreshCw, ShieldCheck } from "lucide-react";
import PatientTable from "../components/PatientTable";
import RegistrationStepperForm from "../components/RegistrationStepperForm";
import { patientApi } from "../services/api";

export default function Patients({
  onSelectPatientForEmr,
  onSelectPatientForAppt,
}) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await patientApi.getPatients();
      if (Array.isArray(data)) {
        setPatients(data);
      } else {
        setPatients([]);
      }
    } catch (err) {
      // Fallback local seed data for offline / preview
      setPatients([
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
            allergies: "Penicillin",
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
        {
          id: "p-103",
          first_name: "Theresa",
          last_name: "Webb",
          date_of_birth: "1994-03-29",
          gender: "FEMALE",
          national_id: "321-65-8790",
          phone: "+1 (555) 492-3810",
          address: "789 Pine Road, Springfield",
          emergency_contact: {
            name: "James Webb",
            relationship: "Parent",
            phone: "+1 (555) 492-1100",
          },
          insurance_info: {
            provider: "Aetna Health",
            policy_number: "AET-33019",
            allergies: "None",
            blood_type: "B+",
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCreated = (newPatient) => {
    if (newPatient) {
      setPatients((prev) => [newPatient, ...prev]);
    } else {
      fetchPatients();
    }
  };

  const handleOpenEmr = (patient) => {
    if (onSelectPatientForEmr) {
      onSelectPatientForEmr(patient);
    }
    navigate("/emr");
  };

  const handleBookAppt = (patient) => {
    if (onSelectPatientForAppt) {
      onSelectPatientForAppt(patient);
    }
    navigate("/appointments");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Master Patient Index (MPI) Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized demographic registry, insurance verification, and
            electronic health identity records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPatients}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="Refresh Directory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Table */}
      <PatientTable
        patients={patients}
        loading={loading}
        error={error}
        onSelectPatient={handleOpenEmr}
        onBookAppointment={handleBookAppt}
      />

      {/* Registration Stepper Modal */}
      <RegistrationStepperForm
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handlePatientCreated}
        existingPatients={patients}
      />
    </div>
  );
}
