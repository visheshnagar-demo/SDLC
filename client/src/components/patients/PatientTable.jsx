import React from "react";
import {
  User,
  Phone,
  Shield,
  Edit2,
  CalendarPlus,
  AlertCircle,
} from "lucide-react";

export function PatientTable({
  patients = [],
  loading = false,
  error = null,
  onEditPatient,
  onBookAppointment,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
        <p className="text-xs text-slate-500 font-medium">
          Loading patient directory...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <p className="text-sm font-semibold">Unable to load patients</p>
        <p className="text-xs mt-1 text-rose-600">{error}</p>
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-sm font-semibold text-slate-800">
          No Patient Records Found
        </p>
        <p className="text-xs mt-1 text-slate-500">
          Click "Register New Patient" to create the first patient record.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Patient Code / Name</th>
              <th className="py-3 px-4">DOB & Gender</th>
              <th className="py-3 px-4">Contact Details</th>
              <th className="py-3 px-4">Emergency Contact</th>
              <th className="py-3 px-4">Insurance Info</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-slate-50/70 transition-colors"
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs">
                      {patient.first_name ? patient.first_name[0] : "P"}
                      {patient.last_name ? patient.last_name[0] : ""}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {patient.first_name} {patient.last_name}
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50/80 px-1.5 py-0.2 rounded border border-indigo-100/80 inline-block mt-0.5">
                        {patient.patient_code ||
                          `PAT-${patient.id.slice(0, 6).toUpperCase()}`}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  <span className="block font-medium text-slate-800">
                    {patient.date_of_birth}
                  </span>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {patient.gender?.toLowerCase() || "N/A"}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{patient.phone_number || "No phone"}</span>
                  </div>
                  {patient.email && (
                    <span className="text-[11px] text-slate-500 block truncate max-w-[160px]">
                      {patient.email}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  <span className="font-medium text-slate-800 block">
                    {patient.emergency_contact_name || "None listed"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {patient.emergency_contact_phone || ""}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1 text-slate-800 font-medium">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{patient.insurance_provider || "Self Pay"}</span>
                  </div>
                  {patient.insurance_policy_number && (
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {patient.insurance_policy_number}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        onBookAppointment && onBookAppointment(patient)
                      }
                      title="Book Appointment"
                      className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-100 transition-colors"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditPatient && onEditPatient(patient)}
                      title="Edit Profile"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PatientTable;
