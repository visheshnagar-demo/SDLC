import React, { useState } from "react";
import {
  UserCheck,
  Stethoscope,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export function DoctorRosterList({
  doctors = [],
  selectedDoctor = null,
  onSelectDoctor,
  loading = false,
  error = null,
}) {
  const [selectedDept, setSelectedDept] = useState("ALL");

  const departments = [
    "ALL",
    "Cardiology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
    "General Medicine",
    "Dermatology",
  ];

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDept === "ALL") return true;
    return (doc.department || "").toLowerCase() === selectedDept.toLowerCase();
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
        <p className="text-xs text-slate-500 font-medium">
          Loading physician roster...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <p className="text-sm font-semibold">Unable to load doctors</p>
        <p className="text-xs mt-1 text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Department Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDept === dept
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-medium">
            No doctors found for department "{selectedDept}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => {
            const isSelected = selectedDoctor?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoctor && onSelectDoctor(doc)}
                className={`p-4 rounded-xl border cursor-pointer transition-all bg-white text-left ${
                  isSelected
                    ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
                    : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {doc.user?.full_name ? doc.user.full_name[0] : "D"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {doc.user?.full_name ||
                          `Dr. ${doc.doctor_code || "Physician"}`}
                      </h4>
                      <span className="text-[11px] text-indigo-600 font-medium block">
                        {doc.department || "General Specialist"}
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    status={doc.is_available ? "AVAILABLE" : "OFF_DUTY"}
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Doctor Code:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {doc.doctor_code || "DOC-101"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Qualifications:</span>
                    <span className="font-medium text-slate-700">
                      {doc.qualification || "MD, MBBS"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Slot Duration:</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {doc.slot_duration_minutes || 30} mins
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-emerald-600">
                      ${doc.consultation_fee || 120}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DoctorRosterList;
