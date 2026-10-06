import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  RefreshCw,
} from "lucide-react";
import { appointmentApi } from "../../services/api.js";
import Badge from "../common/Badge.jsx";

export const AppointmentScheduler = ({ onAppointmentBooked = () => {} }) => {
  const [department, setDepartment] = useState("Cardiology");
  const [doctorId, setDoctorId] = useState("doc-101");
  const [doctorName, setDoctorName] = useState("Dr. Sarah Jenkins");
  const [appointmentDate, setAppointmentDate] = useState("2026-06-10");
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");
  const [patientName, setPatientName] = useState("Jane Doe (MRN-99201)");
  const [patientId, setPatientId] = useState("pat-99201");
  const [appointmentType, setAppointmentType] = useState(
    "Consultation / Routine Checkup",
  );
  const [reason, setReason] = useState(
    "Persistent hypertension and chest tightness following exercise.",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const slots = [
    { time: "09:00 AM", status: "Booked" },
    { time: "09:30 AM", status: "Booked" },
    { time: "10:00 AM", status: "Available" },
    { time: "10:30 AM", status: "Available" },
    { time: "11:00 AM", status: "Available" },
    { time: "01:30 PM", status: "Booked" },
    { time: "02:00 PM", status: "Available" },
    { time: "02:30 PM", status: "Available" },
  ];

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        start_time: selectedSlot,
        end_time: "30 mins",
        reason: `${appointmentType}: ${reason}`,
        status: "Scheduled",
      };

      const result = await appointmentApi.bookAppointment(payload);
      setSuccess(
        `Appointment booked successfully with ${doctorName} on ${appointmentDate} at ${selectedSlot}!`,
      );
      onAppointmentBooked(result);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to reserve appointment slot. Slot may be locked by another user.";
      setError(
        typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Slot Booking Form */}
      <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">
            Provider Schedule & Slot Reservation
          </h2>
          <Badge variant="primary">Real-time FHIR Sync</Badge>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-800"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Scheduling Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            role="alert"
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Booking Confirmed</p>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Doctor & Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="dept_select"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Department
            </label>
            <select
              id="dept_select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="General Medicine">General Medicine</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="doctor_select"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Doctor / Specialist
            </label>
            <select
              id="doctor_select"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setDoctorName(e.target.options[e.target.selectedIndex].text);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="doc-101">Dr. Sarah Jenkins</option>
              <option value="doc-102">Dr. Robert Chen</option>
              <option value="doc-103">Dr. Lisa Patel</option>
              <option value="doc-104">Dr. Michael Marcus</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="appointment_date_input"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Date
            </label>
            <input
              id="appointment_date_input"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Optimistic Concurrency Banner */}
        <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                Optimistic Concurrency Lock Active
              </p>
              <p className="text-xs text-teal-700">
                Selected slot ({selectedSlot}) is tentatively reserved for
                booking.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-teal-800 bg-white px-2.5 py-1 rounded border border-teal-300">
            04:42 remaining
          </span>
        </div>

        {/* 30-Minute Time Slot Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Available 30-Minute Time Slots
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.time;
              const isBooked = slot.status === "Booked";

              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={isBooked}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`p-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    isBooked
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : isSelected
                        ? "bg-teal-600 border-teal-600 text-white font-bold shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-teal-500 hover:bg-teal-50/50"
                  }`}
                >
                  <div>{slot.time}</div>
                  <span
                    className={`text-[10px] ${isSelected ? "text-teal-100" : "text-slate-400"}`}
                  >
                    {isBooked
                      ? "Booked"
                      : isSelected
                        ? "Selected"
                        : "Available"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Patient Details & Clinical Reason */}
        <form
          onSubmit={handleBook}
          className="space-y-4 pt-4 border-t border-slate-100"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="patient_select"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Select Patient *
              </label>
              <select
                id="patient_select"
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  setPatientName(e.target.options[e.target.selectedIndex].text);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="pat-99201">Jane Doe (MRN-99201)</option>
                <option value="pat-84920">Marcus Vance (MRN-84920)</option>
                <option value="pat-77102">Elena Rostova (MRN-77102)</option>
                <option value="pat-65403">David Kim (MRN-65403)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="appointment_type_select"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Appointment Type
              </label>
              <select
                id="appointment_type_select"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Consultation / Routine Checkup">
                  Consultation / Routine Checkup
                </option>
                <option value="Follow-up Consultation">
                  Follow-up Consultation
                </option>
                <option value="Diagnostic Review">Diagnostic Review</option>
                <option value="Urgent Clinical Triage">
                  Urgent Clinical Triage
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="clinical_notes_textarea"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Chief Complaint / Clinical Referral Notes *
            </label>
            <textarea
              id="clinical_notes_textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="State patient's symptoms, referral history, or consultation goals..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setReason("");
                setSelectedSlot("10:00 AM");
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm & Book Appointment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Schedule Queue Sidebar */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Today's Schedule Queue
            </h3>
            <span className="text-[11px] text-teal-600 font-semibold">
              4 Patients
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "q1",
                patient: "Marcus Vance",
                time: "09:00 AM",
                status: "Completed",
                variant: "success",
              },
              {
                id: "q2",
                patient: "Elena Rostova",
                time: "09:30 AM",
                status: "In Progress",
                variant: "warning",
              },
              {
                id: "q3",
                patient: "Jane Doe",
                time: "10:00 AM",
                status: "Scheduled",
                variant: "info",
              },
              {
                id: "q4",
                patient: "David Kim",
                time: "11:30 AM",
                status: "Scheduled",
                variant: "info",
              },
            ].map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {item.patient}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {item.time} &bull; Dr. Jenkins
                    </span>
                  </div>
                </div>
                <Badge variant={item.variant}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
            Cancellation Policy Notice
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Appointments canceled at least 24 hours in advance will
            automatically release the optimistic slot back to the public pool
            and alert waiting list patients.
          </p>
        </div>
      </div>
    </div>
  );
};

AppointmentScheduler.propTypes = {
  onAppointmentBooked: PropTypes.func,
};

export default AppointmentScheduler;
