import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  CalendarPlus,
  Edit,
  User,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function PatientTable({
  patients = [],
  loading = false,
  error = null,
  onSelectPatient,
  onBookAppointment,
  onEditPatient,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");

  const calculateAge = (dob) => {
    if (!dob) return "--";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "--";
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const maskNationalId = (id) => {
    if (!id) return "N/A";
    const str = String(id);
    if (str.length <= 4) return str;
    return `***-**-${str.slice(-4)}`;
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
    const ssn = String(p.national_id || "").toLowerCase();
    const phone = String(p.phone || "").toLowerCase();
    const id = String(p.id || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      ssn.includes(query) ||
      phone.includes(query) ||
      id.includes(query);

    const matchesGender =
      genderFilter === "ALL" ||
      (p.gender && p.gender.toUpperCase() === genderFilter.toUpperCase());

    return matchesSearch && matchesGender;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Controls / Filters Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SSN, phone, MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500">
              Gender:
            </span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium px-2">
            Total: <strong>{filteredPatients.length}</strong>
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/80 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Patient Name & MRN</th>
              <th className="py-3 px-4">SSN / National ID</th>
              <th className="py-3 px-4">DOB (Age)</th>
              <th className="py-3 px-4">Gender</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Insurance Info</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full"></span>
                    <span>Loading patient records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <User className="h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      No patient records found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try adjusting your search criteria or register a new
                      patient.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => {
                const insurance = patient.insurance_info || {};
                const insuranceDisplay =
                  typeof insurance === "string"
                    ? insurance
                    : insurance.provider
                      ? `${insurance.provider} (${insurance.policy_number || "INS"})`
                      : "Self-Pay / None";

                return (
                  <tr
                    key={patient.id || patient.national_id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 border border-sky-200">
                          {patient.first_name?.[0] || "P"}
                          {patient.last_name?.[0] || ""}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            MRN:{" "}
                            {patient.id
                              ? String(patient.id).slice(0, 8)
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {maskNationalId(patient.national_id)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{patient.date_of_birth || "N/A"}</div>
                      <div className="text-[10px] text-slate-400">
                        {calculateAge(patient.date_of_birth)} yrs
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          patient.gender?.toUpperCase() === "FEMALE"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : patient.gender?.toUpperCase() === "MALE"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {patient.gender || "UNSPECIFIED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{patient.phone || "--"}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span
                          className="truncate max-w-[160px]"
                          title={insuranceDisplay}
                        >
                          {insuranceDisplay}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            onSelectPatient && onSelectPatient(patient)
                          }
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Open EMR Record"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            onBookAppointment && onBookAppointment(patient)
                          }
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          title="Book Appointment"
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </button>
                        {onEditPatient && (
                          <button
                            onClick={() => onEditPatient(patient)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Profile"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            onSelectPatient && onSelectPatient(patient)
                          }
                          className="p-1 text-slate-300 group-hover:text-slate-600 transition"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
