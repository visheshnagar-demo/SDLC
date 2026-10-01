import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Lock,
  Stethoscope,
  Filter,
  XCircle,
  Check,
} from "lucide-react";
import { appointmentApi } from "../services/api";

const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
];

const DEPARTMENTS = [
  "All Departments",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
  "Emergency",
];

const DEFAULT_DOCTORS = [
  {
    id: "doc-101",
    first_name: "Sarah",
    last_name: "Smith",
    specialty: "Cardiologist",
    department: "Cardiology",
    license_number: "MD-98432",
  },
  {
    id: "doc-102",
    first_name: "Marcus",
    last_name: "Vance",
    specialty: "Neurologist",
    department: "Neurology",
    license_number: "MD-77129",
  },
  {
    id: "doc-103",
    first_name: "Elena",
    last_name: "Reyes",
    specialty: "Pediatrician",
    department: "Pediatrics",
    license_number: "MD-65201",
  },
  {
    id: "doc-104",
    first_name: "David",
    last_name: "Chen",
    specialty: "Orthopedic Surgeon",
    department: "Orthopedics",
    license_number: "MD-41098",
  },
  {
    id: "doc-105",
    first_name: "Amanda",
    last_name: "Taylor",
    specialty: "Internal Medicine",
    department: "General Medicine",
    license_number: "MD-55823",
  },
];

export default function AppointmentScheduler({
  patients = [],
  appointments = [],
  onRefresh,
  preSelectedPatient = null,
}) {
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    DEFAULT_DOCTORS[0].id,
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");
  const [selectedPatientId, setSelectedPatientId] = useState(
    preSelectedPatient?.id || patients[0]?.id || "",
  );
  const [reason, setReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [slotLockTimer, setSlotLockTimer] = useState(300); // 5 min lock countdown

  useEffect(() => {
    if (preSelectedPatient?.id) {
      setSelectedPatientId(preSelectedPatient.id);
    } else if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [preSelectedPatient, patients]);

  useEffect(() => {
    // Reset slot lock timer on slot change
    setSlotLockTimer(300);
    const interval = setInterval(() => {
      setSlotLockTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSlot, selectedDoctorId, selectedDate]);

  const filteredDoctors = DEFAULT_DOCTORS.filter((doc) =>
    selectedDept === "All Departments" ? true : doc.department === selectedDept,
  );

  const currentDoctor =
    DEFAULT_DOCTORS.find((d) => d.id === selectedDoctorId) ||
    DEFAULT_DOCTORS[0];

  // Detect booked slots for current doctor and date
  const bookedSlots = appointments
    .filter(
      (appt) =>
        String(appt.doctor_id) === String(selectedDoctorId) &&
        String(appt.appointment_time || "").startsWith(selectedDate) &&
        appt.status !== "CANCELLED",
    )
    .map((appt) => {
      const timeStr = new Date(appt.appointment_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return timeStr;
    });

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFeedback({
        type: "error",
        message: "Please select or register a patient first.",
      });
      return;
    }

    setBookingLoading(true);
    setFeedback({ type: null, message: "" });

    try {
      const dateTimeString = `${selectedDate}T${selectedSlot.replace(" ", "")}:00`;
      const payload = {
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        appointment_time: new Date(
          `${selectedDate} ${selectedSlot}`,
        ).toISOString(),
        duration_minutes: 30,
        status: "CONFIRMED",
        reason: reason || "General Medical Consultation",
      };

      await appointmentApi.createAppointment(payload);
      setFeedback({
        type: "success",
        message: `Appointment successfully confirmed for ${selectedDate} at ${selectedSlot}!`,
      });
      setReason("");
      if (onRefresh) onRefresh();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Double-booking detected or slot unavailable. Please select another time.";
      setFeedback({
        type: "error",
        message: typeof detail === "string" ? detail : JSON.stringify(detail),
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentApi.updateAppointmentStatus(appointmentId, newStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: "Failed to update appointment status.",
      });
    }
  };

  const formatLockTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Concurrency Lock Banner */}
      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-800">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-sky-600 shrink-0" />
          <span className="font-semibold">
            Concurrency Lock Active: Slot [{selectedSlot}] on [{selectedDate}]
            is reserved for 5 minutes.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
          <Clock className="h-3 w-3" />
          <span>{formatLockTime(slotLockTimer)}</span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback.message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Two-Column Scheduling Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Doctor & Slot Grid (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-sky-600" />
              Doctor Availability & Time Slots
            </h3>
            <span className="text-[11px] text-slate-400">
              30-min Allocations
            </span>
          </div>

          {/* Department & Doctor Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Clinical Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  const firstDoc = DEFAULT_DOCTORS.find(
                    (d) =>
                      e.target.value === "All Departments" ||
                      d.department === e.target.value,
                  );
                  if (firstDoc) setSelectedDoctorId(firstDoc.id);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Attending Physician
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.first_name} {doc.last_name} ({doc.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Select Appointment Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Time Slot Allocation Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-600">
                Available 30-Minute Schedule Slots
              </label>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>{" "}
                  Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-600"></span>{" "}
                  Selected
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>{" "}
                  Booked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                const isBooked = bookedSlots.includes(slot);

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isBooked
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through"
                        : isSelected
                          ? "bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300"
                          : "bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-700 hover:border-sky-300"
                    }`}
                  >
                    <span>{slot}</span>
                    <span
                      className={`text-[9px] ${
                        isBooked
                          ? "text-slate-400"
                          : isSelected
                            ? "text-sky-100"
                            : "text-emerald-600"
                      }`}
                    >
                      {isBooked ? "Booked" : isSelected ? "Holding" : "Open"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Booking Intake & Upcoming List (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Booking Confirmation Card */}
          <form
            onSubmit={handleBookAppointment}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Confirm Slot Reservation
              </h3>
              <p className="text-[11px] text-slate-500">
                Dr. {currentDoctor.first_name} {currentDoctor.last_name} &bull;{" "}
                {selectedDate} at {selectedSlot}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {patients.length === 0 ? (
                  <option value="">No patients registered</option>
                ) : (
                  patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} (MRN:{" "}
                      {String(p.id).slice(0, 8)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Chief Complaint / Reason for Visit
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Follow-up consultation, chest discomfort, blood pressure review"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={bookingLoading || patients.length === 0}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {bookingLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Verifying Availability...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lock & Book Appointment</span>
                </>
              )}
            </button>
          </form>

          {/* Upcoming Schedule Mini-List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Upcoming Scheduled Visits ({appointments.length})
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {appointments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No appointments scheduled.
                </p>
              ) : (
                appointments.slice(0, 5).map((appt) => {
                  const patient = patients.find(
                    (p) => p.id === appt.patient_id,
                  );
                  const patientName = patient
                    ? `${patient.first_name} ${patient.last_name}`
                    : `Patient #${String(appt.patient_id).slice(0, 6)}`;

                  return (
                    <div
                      key={appt.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {patientName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {new Date(
                              appt.appointment_time,
                            ).toLocaleDateString()}{" "}
                            {new Date(appt.appointment_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            appt.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : appt.status === "COMPLETED"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : appt.status === "CANCELLED"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {appt.status}
                        </span>

                        {appt.status !== "CANCELLED" &&
                          appt.status !== "COMPLETED" && (
                            <button
                              onClick={() =>
                                handleStatusChange(appt.id, "CANCELLED")
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Cancel Appointment"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
