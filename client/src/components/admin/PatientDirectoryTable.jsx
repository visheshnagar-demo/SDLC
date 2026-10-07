import React, { useState, useEffect } from "react";
import { patientsApi } from "../../services/api";
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Badge from "../common/Badge";
import PatientRegistrationModal from "../patient/PatientRegistrationModal";

const defaultPatients = [
  {
    id: "PAT-1001",
    full_name: "Eleanor Vance",
    national_id: "***-**-4912",
    date_of_birth: "1984-06-14",
    gender: "Female",
    emergency_contact_name: "Arthur Vance",
    emergency_contact_phone: "+1 555-782-1920",
    insurance_provider: "Aetna Health HMO",
    ssn_status: "VERIFIED",
  },
  {
    id: "PAT-1002",
    full_name: "Marcus Holloway",
    national_id: "***-**-8821",
    date_of_birth: "1992-11-03",
    gender: "Male",
    emergency_contact_name: "Regina Holloway",
    emergency_contact_phone: "+1 555-432-8819",
    insurance_provider: "BlueCross BlueShield",
    ssn_status: "VERIFIED",
  },
  {
    id: "PAT-1003",
    full_name: "Sophia Chen",
    national_id: "***-**-3341",
    date_of_birth: "1979-02-21",
    gender: "Female",
    emergency_contact_name: "David Chen",
    emergency_contact_phone: "+1 555-221-9031",
    insurance_provider: "UnitedHealthcare",
    ssn_status: "FLAGGED_DUPLICATE",
  },
  {
    id: "PAT-1004",
    full_name: "James Wilson",
    national_id: "***-**-7714",
    date_of_birth: "1968-08-30",
    gender: "Male",
    emergency_contact_name: "Sarah Wilson",
    emergency_contact_phone: "+1 555-908-1123",
    insurance_provider: "Medicare Part B",
    ssn_status: "VERIFIED",
  },
  {
    id: "PAT-1005",
    full_name: "Olivia Martinez",
    national_id: "***-**-5529",
    date_of_birth: "1995-12-19",
    gender: "Female",
    emergency_contact_name: "Carlos Martinez",
    emergency_contact_phone: "+1 555-667-3342",
    insurance_provider: "Cigna Health",
    ssn_status: "VERIFIED",
  },
];

export const PatientDirectoryTable = () => {
  const [patients, setPatients] = useState(defaultPatients);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await patientsApi.getPatients({ search: searchQuery });
      if (Array.isArray(res) && res.length > 0) {
        setPatients(res);
      }
    } catch (err) {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      fetchPatients();
    }
  }, [searchQuery]);

  const handleResolveDuplicate = (patientId) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, ssn_status: "VERIFIED" } : p,
      ),
    );
  };

  const filtered = patients.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.national_id?.includes(searchQuery) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header & Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Patient Master Registry
            </h3>
            <p className="text-xs text-slate-500">
              Search records, inspect SSN deduplication, and manage demographic
              intake
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MRN, Name, SSN..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Patient
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5">MRN / Patient ID</th>
              <th className="p-3.5">Full Legal Name</th>
              <th className="p-3.5">National ID / SSN</th>
              <th className="p-3.5">DOB &amp; Gender</th>
              <th className="p-3.5">Emergency Contact</th>
              <th className="p-3.5">Insurance Provider</th>
              <th className="p-3.5">SSN Integrity</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="p-3.5 font-mono font-semibold text-sky-700">
                  {patient.id}
                </td>
                <td className="p-3.5 font-bold text-slate-900">
                  {patient.full_name}
                </td>
                <td className="p-3.5 font-mono text-slate-600">
                  {patient.national_id}
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  {patient.date_of_birth} ({patient.gender})
                </td>
                <td className="p-3.5">
                  <div>{patient.emergency_contact_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {patient.emergency_contact_phone}
                  </div>
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                    {patient.insurance_provider}
                  </span>
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  {patient.ssn_status === "FLAGGED_DUPLICATE" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Duplicate Flagged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Unique
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right whitespace-nowrap">
                  {patient.ssn_status === "FLAGGED_DUPLICATE" ? (
                    <button
                      onClick={() => handleResolveDuplicate(patient.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold shadow-xs transition-colors"
                      title="Resolve duplicate SSN"
                    >
                      <Check className="w-3 h-3" /> Resolve
                    </button>
                  ) : (
                    <button
                      className="p-1 text-slate-400 hover:text-sky-600 rounded"
                      title="View demographics"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {(page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
          entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PatientRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPatientCreated={(newPatient) => {
          setPatients((prev) => [
            {
              id: newPatient.id || `PAT-${Date.now().toString().slice(-4)}`,
              full_name: newPatient.full_name,
              national_id: newPatient.national_id,
              date_of_birth: newPatient.date_of_birth,
              gender: newPatient.gender,
              emergency_contact_name: newPatient.emergency_contact_name,
              emergency_contact_phone: newPatient.emergency_contact_phone,
              insurance_provider: newPatient.insurance_provider,
              ssn_status: "VERIFIED",
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
};

export default PatientDirectoryTable;
