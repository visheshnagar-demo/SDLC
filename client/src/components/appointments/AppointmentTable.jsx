import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  User,
  UserCheck,
  Clock,
  FileText,
  CheckCircle2,
  PlayCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export function AppointmentTable({
  appointments = [],
  loading = false,
  error = null,
  onStatusChange,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
        <p className="text-xs text-slate-500 font-medium">
          Loading appointments schedule...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <p className="text-sm font-semibold">Unable to load appointments</p>
        <p className="text-xs mt-1 text-rose-600">{error}</p>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-sm font-semibold text-slate-800">
          No Appointments Scheduled
        </p>
        <p className="text-xs mt-1 text-slate-500">
          Book an appointment using the Outpatient Booking Portal.
        </p>
      </div>
    );
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Code / Status</th>
              <th className="py-3 px-4">Patient Profile</th>
              <th className="py-3 px-4">Assigned Physician</th>
              <th className="py-3 px-4">Schedule Window</th>
              <th className="py-3 px-4">Reason for Visit</th>
              <th className="py-3 px-4 text-right">Workflow Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {appointments.map((apt) => {
              const status = (apt.status || "CONFIRMED").toUpperCase();

              return (
                <tr
                  key={apt.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                        {apt.appointment_code ||
                          `APT-${apt.id.slice(0, 6).toUpperCase()}`}
                      </span>
                      <div>
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {apt.patient
                            ? `${apt.patient.first_name} ${apt.patient.last_name}`
                            : apt.patient_name ||
                              `Patient #${apt.patient_id?.slice(0, 8)}`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {apt.patient?.phone_number || "Contact verified"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {apt.doctor?.user?.full_name ||
                            apt.doctor_name ||
                            "Dr. Marcus Smith"}
                        </span>
                        <span className="text-[11px] text-indigo-600 font-medium">
                          {apt.doctor?.department || "Cardiology Dept"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(apt.scheduled_start)}</span>
                    </div>
                    {apt.scheduled_end && (
                      <span className="text-[11px] text-slate-400 block ml-5">
                        to {formatDateTime(apt.scheduled_end)}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-[200px]">
                    <span
                      className="font-medium text-slate-800 block truncate"
                      title={apt.reason_for_visit}
                    >
                      {apt.reason_for_visit || "General Consultation"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {status === "PENDING" && (
                        <button
                          onClick={() =>
                            onStatusChange &&
                            onStatusChange(apt.id, "CONFIRMED")
                          }
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirm
                        </button>
                      )}

                      {status === "CONFIRMED" && (
                        <button
                          onClick={() =>
                            onStatusChange &&
                            onStatusChange(apt.id, "IN_PROGRESS")
                          }
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md font-semibold border border-amber-200 transition-colors flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Start Visit
                        </button>
                      )}

                      {(status === "IN_PROGRESS" || status === "CONFIRMED") && (
                        <Link
                          to={`/consultations?appointmentId=${apt.id}`}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold border border-indigo-200 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          EMR
                        </Link>
                      )}

                      {status === "IN_PROGRESS" && (
                        <button
                          onClick={() =>
                            onStatusChange &&
                            onStatusChange(apt.id, "COMPLETED")
                          }
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-semibold border border-emerald-200 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete
                        </button>
                      )}

                      {status !== "COMPLETED" && status !== "CANCELLED" && (
                        <button
                          onClick={() =>
                            onStatusChange &&
                            onStatusChange(apt.id, "CANCELLED")
                          }
                          title="Cancel Appointment"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AppointmentTable;
