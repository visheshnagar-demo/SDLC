import React, { useState } from "react";
import PatientIntakeForm from "../components/patient/PatientIntakeForm.jsx";
import Badge from "../components/common/Badge.jsx";

export const PatientPage = () => {
  const [recentPatients, setRecentPatients] = useState([
    {
      id: "pat-99201",
      name: "Jane Doe",
      mrn: "MRN-99201",
      dob: "1988-04-15",
      gender: "Female",
      phone: "+1 (555) 0199",
      insurance: "BlueCross BlueShield",
      status: "Active",
    },
    {
      id: "pat-84920",
      name: "Marcus Vance",
      mrn: "MRN-84920",
      dob: "1975-11-23",
      gender: "Male",
      phone: "+1 (555) 0142",
      insurance: "Aetna Signature",
      status: "Active",
    },
    {
      id: "pat-77102",
      name: "Elena Rostova",
      mrn: "MRN-77102",
      dob: "1992-08-30",
      gender: "Female",
      phone: "+1 (555) 0187",
      insurance: "UnitedHealthcare",
      status: "Pending Insurance",
    },
  ]);

  const handlePatientCreated = (newPatient) => {
    if (newPatient) {
      setRecentPatients((prev) => [
        {
          id: newPatient.id || `pat-${Date.now()}`,
          name: `${newPatient.first_name || "New"} ${newPatient.last_name || "Patient"}`,
          mrn:
            newPatient.mrn ||
            `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
          dob: newPatient.date_of_birth || "1990-01-01",
          gender: newPatient.gender || "Unknown",
          phone: newPatient.phone || "N/A",
          insurance: newPatient.insurance_provider || "Self-Pay",
          status: "Active",
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Dashboard &gt; Patients &gt; Intake &amp; Registration
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Patient Registration &amp; Demographic Intake
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete intake form for self-service or staff-assisted patient
          registration.
        </p>
      </div>

      {/* Patient Intake Form */}
      <PatientIntakeForm onPatientCreated={handlePatientCreated} />

      {/* Recent Patients Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Master Patient Index (MPI) - Recent Registrations
          </h3>
          <span className="text-xs text-slate-500">
            {recentPatients.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">MRN</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">DOB / Gender</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Insurance Provider</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPatients.map((pat) => (
                <tr
                  key={pat.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-teal-700">
                    {pat.mrn}
                  </td>
                  <td className="p-3 font-semibold text-slate-900">
                    {pat.name}
                  </td>
                  <td className="p-3 text-slate-600">
                    {pat.dob} ({pat.gender})
                  </td>
                  <td className="p-3 text-slate-600">{pat.phone}</td>
                  <td className="p-3 text-slate-700">{pat.insurance}</td>
                  <td className="p-3">
                    <Badge
                      variant={pat.status === "Active" ? "success" : "warning"}
                    >
                      {pat.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientPage;
