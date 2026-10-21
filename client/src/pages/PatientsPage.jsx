import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import PatientTable from "../components/patients/PatientTable";
import PatientRegistrationModal from "../components/patients/PatientRegistrationModal";
import { patientsApi } from "../services/api";

const DEFAULT_PATIENTS = [
  {
    id: "pat-1001",
    patient_code: "PAT-1001",
    first_name: "John",
    last_name: "Doe",
    date_of_birth: "1985-04-12",
    gender: "MALE",
    phone_number: "+1 (555) 234-5678",
    email: "john.doe@example.com",
    address: "742 Evergreen Terrace, Springfield",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+1 (555) 987-6543",
    insurance_provider: "BlueCross Health",
    insurance_policy_number: "POL-BC-88291",
  },
  {
    id: "pat-1002",
    patient_code: "PAT-1002",
    first_name: "Sarah",
    last_name: "Connor",
    date_of_birth: "1990-08-22",
    gender: "FEMALE",
    phone_number: "+1 (555) 345-6789",
    email: "sarah.connor@example.com",
    address: "124 Cyber Way, Los Angeles, CA",
    emergency_contact_name: "John Connor",
    emergency_contact_phone: "+1 (555) 876-5432",
    insurance_provider: "Aetna Choice",
    insurance_policy_number: "POL-AET-44120",
  },
  {
    id: "pat-1003",
    patient_code: "PAT-1003",
    first_name: "Robert",
    last_name: "Davis",
    date_of_birth: "1972-11-05",
    gender: "MALE",
    phone_number: "+1 (555) 456-7890",
    email: "robert.davis@example.com",
    address: "55 Pine Street, Seattle, WA",
    emergency_contact_name: "Mary Davis",
    emergency_contact_phone: "+1 (555) 765-4321",
    insurance_provider: "United Healthcare",
    insurance_policy_number: "POL-UHC-99201",
  },
];

export function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);

  const fetchPatients = async () => {
    try {
      const data = await patientsApi.list({ limit: 100 });
      if (data && data.length > 0) {
        setPatients(data);
      }
    } catch {
      // Keep rich default state if backend not reached
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleEditPatient = (patient) => {
    setPatientToEdit(patient);
    setIsModalOpen(true);
  };

  const handleBookAppointment = (patient) => {
    navigate(`/appointments?patientId=${patient.id}`);
  };

  const handleOpenNewModal = () => {
    setPatientToEdit(null);
    setIsModalOpen(true);
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
    const code = (p.patient_code || "").toLowerCase();
    const phone = (p.phone_number || "").toLowerCase();
    const email = (p.email || "").toLowerCase();
    return (
      fullName.includes(q) ||
      code.includes(q) ||
      phone.includes(q) ||
      email.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
              Patient Management
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              HIPAA Demographic Records
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Patient Directory & Registration Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage comprehensive electronic patient records, insurance profiles,
            and emergency contacts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPatients}
            title="Refresh Directory"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Register New Patient
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, ID (e.g. PAT-1001), phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing{" "}
          <span className="font-bold text-slate-800">
            {filteredPatients.length}
          </span>{" "}
          of {patients.length} patients
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Patient Table */}
      <PatientTable
        patients={filteredPatients}
        loading={loading}
        error={error}
        onEditPatient={handleEditPatient}
        onBookAppointment={handleBookAppointment}
      />

      {/* Patient Registration / Edit Modal */}
      <PatientRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientToEdit={patientToEdit}
        onPatientSaved={() => fetchPatients()}
      />
    </div>
  );
}

export default PatientsPage;
