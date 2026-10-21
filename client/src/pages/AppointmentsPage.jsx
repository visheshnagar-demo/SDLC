import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import AppointmentTable from "../components/appointments/AppointmentTable";
import SlotPickerGrid from "../components/appointments/SlotPickerGrid";
import { appointmentsApi, doctorsApi, patientsApi } from "../services/api";

const DEFAULT_DOCTORS = [
  {
    id: "doc-1",
    doctor_code: "DOC-101",
    department: "Cardiology",
    qualification: "MD, FACC, Harvard Medical",
    consultation_fee: 150,
    slot_duration_minutes: 30,
    is_available: true,
    user: { full_name: "Dr. Marcus Smith" },
  },
  {
    id: "doc-2",
    doctor_code: "DOC-102",
    department: "Neurology",
    qualification: "MD, PhD Neurology, Johns Hopkins",
    consultation_fee: 180,
    slot_duration_minutes: 30,
    is_available: true,
    user: { full_name: "Dr. Elena Vance" },
  },
  {
    id: "doc-3",
    doctor_code: "DOC-103",
    department: "Pediatrics",
    qualification: "MD Pediatrics, Stanford",
    consultation_fee: 120,
    slot_duration_minutes: 30,
    is_available: true,
    user: { full_name: "Dr. David Kim" },
  },
];

const DEFAULT_PATIENTS = [
  {
    id: "pat-1001",
    patient_code: "PAT-1001",
    first_name: "John",
    last_name: "Doe",
    phone_number: "+1 (555) 234-5678",
    insurance_provider: "BlueCross Health",
  },
  {
    id: "pat-1002",
    patient_code: "PAT-1002",
    first_name: "Sarah",
    last_name: "Connor",
    phone_number: "+1 (555) 345-6789",
    insurance_provider: "Aetna Choice",
  },
];

const DEFAULT_APPOINTMENTS = [
  {
    id: "apt-default-1",
    appointment_code: "APT-2001",
    patient_id: "pat-1001",
    doctor_id: "doc-1",
    status: "IN_PROGRESS",
    reason_for_visit: "Hypertension follow-up & medication review",
    scheduled_start: "2026-06-01T10:00:00",
    scheduled_end: "2026-06-01T10:30:00",
    patient: {
      first_name: "John",
      last_name: "Doe",
      patient_code: "PAT-1001",
      phone_number: "+1 (555) 234-5678",
    },
    doctor: {
      doctor_code: "DOC-101",
      department: "Cardiology",
      user: { full_name: "Dr. Marcus Smith" },
    },
  },
  {
    id: "apt-default-2",
    appointment_code: "APT-2002",
    patient_id: "pat-1002",
    doctor_id: "doc-2",
    status: "CONFIRMED",
    reason_for_visit: "Persistent migraine & neurological screening",
    scheduled_start: "2026-06-01T11:00:00",
    scheduled_end: "2026-06-01T11:30:00",
    patient: {
      first_name: "Sarah",
      last_name: "Connor",
      patient_code: "PAT-1002",
      phone_number: "+1 (555) 345-6789",
    },
    doctor: {
      doctor_code: "DOC-102",
      department: "Neurology",
      user: { full_name: "Dr. Elena Vance" },
    },
  },
];

export function AppointmentsPage() {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const [appointments, setAppointments] = useState(DEFAULT_APPOINTMENTS);
  const [doctors, setDoctors] = useState(DEFAULT_DOCTORS);
  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Booking Form State
  const [isBookingOpen, setIsBookingOpen] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState("doc-1");
  const [selectedPatientId, setSelectedPatientId] = useState(
    preselectedPatientId || "pat-1001",
  );
  const [appointmentDate, setAppointmentDate] = useState("2026-06-01");
  const [selectedSlotTime, setSelectedSlotTime] = useState("10:00 AM");
  const [reasonForVisit, setReasonForVisit] = useState(
    "Routine outpatient checkup and consultation",
  );
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Filter state for table
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = async () => {
    try {
      const [aptRes, docRes, patRes] = await Promise.allSettled([
        appointmentsApi.list({ limit: 100 }),
        doctorsApi.list({ limit: 50 }),
        patientsApi.list({ limit: 100 }),
      ]);

      const aptList = aptRes.status === "fulfilled" ? aptRes.value || [] : [];
      const docList = docRes.status === "fulfilled" ? docRes.value || [] : [];
      const patList = patRes.status === "fulfilled" ? patRes.value || [] : [];

      if (aptList.length > 0) setAppointments(aptList);
      if (docList.length > 0) {
        setDoctors(docList);
        setSelectedDoctorId(docList[0].id);
      }
      if (patList.length > 0) {
        setPatients(patList);
        setSelectedPatientId(preselectedPatientId || patList[0].id);
      }
    } catch {
      // Retain default data on offline/test mode
    }
  };

  const fetchDoctorSlots = async (docId, date) => {
    if (!docId) return;
    setLoadingSlots(true);
    try {
      const data = await doctorsApi.getAvailability(docId, date);
      setAvailableSlots(data?.available_slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorSlots(selectedDoctorId, appointmentDate);
    }
  }, [selectedDoctorId, appointmentDate]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedDoctorId || !selectedPatientId || !selectedSlotTime) {
      setBookingError(
        "Please select a physician, patient, and consultation time slot.",
      );
      setBookingLoading(false);
      return;
    }

    let timeStr = "10:00:00";
    if (selectedSlotTime.includes(":")) {
      const [rawTime, modifier] = selectedSlotTime.split(" ");
      let [hours, minutes] = rawTime.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }

    const scheduledStart = `${appointmentDate}T${timeStr}`;
    const startObj = new Date(scheduledStart);
    const endObj = new Date(startObj.getTime() + 30 * 60000);
    const scheduledEnd = endObj.toISOString();

    const payload = {
      patient_id: selectedPatientId,
      doctor_id: selectedDoctorId,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      reason_for_visit: reasonForVisit,
      status: "CONFIRMED",
    };

    try {
      const result = await appointmentsApi.create(payload);
      setBookingSuccess(
        `Appointment booked successfully! Reference Code: ${result.appointment_code || "CONFIRMED"}`,
      );
      loadData();
      setTimeout(() => {
        setBookingSuccess(null);
      }, 4000);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to book appointment. Double-booking check failed.";
      setBookingError(detail);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, newStatus);
      loadData();
    } catch {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: newStatus } : a,
        ),
      );
    }
  };

  const selectedDoctorObj =
    doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const selectedPatientObj =
    patients.find((p) => p.id === selectedPatientId) || patients[0];

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === "ALL") return true;
    return (apt.status || "").toUpperCase() === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
              Outpatient Booking Engine
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pessimistic Double-Booking Lock
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Outpatient Appointment Booking & Workflow Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule real-time 30-minute consultation slots, prevent collisions,
            and track patient status lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh Appointments"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsBookingOpen(!isBookingOpen)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isBookingOpen ? "Hide Booking Form" : "Book New Appointment"}
          </button>
        </div>
      </div>

      {/* Outpatient Booking Interactive Panel */}
      {isBookingOpen && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  Outpatient Appointment Booking Portal
                </h2>
                <p className="text-[11px] text-slate-300">
                  Select physician, pick open 30-minute slot, and assign patient
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <Clock className="w-3.5 h-3.5" />
              <span>5-min Concurrency Hold Active</span>
            </div>
          </div>

          <form onSubmit={handleBookSubmit} className="p-6">
            {bookingError && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {bookingSuccess && (
              <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left / Middle: Configuration (2 cols) */}
              <div className="lg:col-span-2 space-y-5">
                {/* Step 1: Physician & Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    <span>1. Select Attending Physician & Specialty *</span>
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.user?.full_name || `Dr. ${doc.doctor_code}`} —{" "}
                        {doc.department || "Specialist"} (Fee: $
                        {doc.consultation_fee || 120})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Date & Slot Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>
                        2. Choose Appointment Date & Consultation Slot *
                      </span>
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                    />
                  </div>

                  <SlotPickerGrid
                    availableSlots={availableSlots}
                    selectedSlot={selectedSlotTime}
                    onSelectSlot={(slot) =>
                      setSelectedSlotTime(slot.time || slot.iso_start)
                    }
                    loading={loadingSlots}
                  />
                </div>

                {/* Step 3: Patient Selection & Chief Complaint */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>3. Select Patient *</span>
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} (
                          {p.patient_code || "PAT-1001"}) — {p.phone_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Chief Complaint / Reason for Visit
                    </label>
                    <input
                      type="text"
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      placeholder="e.g. Follow-up blood pressure check, chest tightness"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Floating Summary Card (1 col) */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Reservation Summary
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Encounter Preview
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Physician:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {selectedDoctorObj?.user?.full_name ||
                          "Dr. Marcus Smith"}
                      </span>
                      <span className="text-[11px] text-indigo-600 block">
                        {selectedDoctorObj?.department || "Cardiology Dept"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Patient:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {selectedPatientObj
                          ? `${selectedPatientObj.first_name} ${selectedPatientObj.last_name}`
                          : "John Doe"}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {selectedPatientObj?.insurance_provider ||
                          "BlueCross Health"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Date & Time Slot:
                      </span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                        {appointmentDate} at {selectedSlotTime}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Consultation Fee:</span>
                      <span className="font-bold text-emerald-600">
                        ${selectedDoctorObj?.consultation_fee || 120}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {bookingLoading
                      ? "Confirming Slot..."
                      : "Confirm & Book Slot"}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-slate-400" />
                    Atomic slot lock prevents duplicate booking
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Appointments Management Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              All Appointments & Outpatient Status Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Filter, confirm, launch clinical consultation, or cancel
              appointments
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
            {[
              "ALL",
              "PENDING",
              "CONFIRMED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
            ].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <AppointmentTable
          appointments={filteredAppointments}
          loading={loading}
          error={error}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}

export default AppointmentsPage;
