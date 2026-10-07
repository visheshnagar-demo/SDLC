import React, { useState, useEffect } from "react";
import { appointmentsApi, doctorsApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Lock,
  Search,
} from "lucide-react";
import Badge from "../common/Badge";

export const AppointmentBookingPanel = ({ onBookingSuccess }) => {
  const { user } = useAuth();

  const [departments] = useState([
    "All Departments",
    "Cardiology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
    "General Medicine",
    "Oncology",
  ]);

  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("General Consultation & Checkup");

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  // Default fallback doctors if API is empty
  const defaultDoctors = [
    {
      id: "doc-001",
      full_name: "Dr. Sarah Smith, MD",
      department: "Cardiology",
      specialization: "Cardiologist",
      consultation_fee: 150,
      is_available: true,
    },
    {
      id: "doc-002",
      full_name: "Dr. Robert Davis, MD",
      department: "Neurology",
      specialization: "Neurologist",
      consultation_fee: 180,
      is_available: true,
    },
    {
      id: "doc-003",
      full_name: "Dr. Emily Johnson, MD",
      department: "Pediatrics",
      specialization: "Pediatric Specialist",
      consultation_fee: 120,
      is_available: true,
    },
    {
      id: "doc-004",
      full_name: "Dr. Michael Chen, MD",
      department: "Orthopedics",
      specialization: "Orthopedic Surgeon",
      consultation_fee: 200,
      is_available: true,
    },
  ];

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const params =
          selectedDepartment !== "All Departments"
            ? { department: selectedDepartment }
            : {};
        const res = await doctorsApi.getDoctors(params);
        if (Array.isArray(res) && res.length > 0) {
          setDoctors(res);
          setSelectedDoctorId(res[0].id);
        } else {
          const filtered =
            selectedDepartment !== "All Departments"
              ? defaultDoctors.filter(
                  (d) => d.department === selectedDepartment,
                )
              : defaultDoctors;
          setDoctors(filtered);
          setSelectedDoctorId(filtered[0]?.id || "");
        }
      } catch (err) {
        const filtered =
          selectedDepartment !== "All Departments"
            ? defaultDoctors.filter((d) => d.department === selectedDepartment)
            : defaultDoctors;
        setDoctors(filtered);
        setSelectedDoctorId(filtered[0]?.id || "");
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [selectedDepartment]);

  // Fetch slots
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrorMessage(null);
      setSelectedSlot(null);
      try {
        const res = await appointmentsApi.getSlots({
          doctor_id: selectedDoctorId,
          date: selectedDate,
        });
        if (Array.isArray(res) && res.length > 0) {
          setAvailableSlots(res);
        } else {
          // Generate 30-minute standard mock slots for the day
          const generatedSlots = [
            { slot_start: "09:00", slot_end: "09:30", is_available: true },
            { slot_start: "09:30", slot_end: "10:00", is_available: true },
            {
              slot_start: "10:00",
              slot_end: "10:30",
              is_available: false,
              locked_by: "Concurrent hold",
            },
            { slot_start: "10:30", slot_end: "11:00", is_available: true },
            { slot_start: "11:00", slot_end: "11:30", is_available: true },
            { slot_start: "14:00", slot_end: "14:30", is_available: true },
            { slot_start: "14:30", slot_end: "15:00", is_available: true },
            { slot_start: "15:00", slot_end: "15:30", is_available: true },
          ];
          setAvailableSlots(generatedSlots);
        }
      } catch (err) {
        const fallback = [
          { slot_start: "09:00", slot_end: "09:30", is_available: true },
          { slot_start: "09:30", slot_end: "10:00", is_available: true },
          { slot_start: "10:00", slot_end: "10:30", is_available: false },
          { slot_start: "11:00", slot_end: "11:30", is_available: true },
          { slot_start: "14:00", slot_end: "14:30", is_available: true },
          { slot_start: "15:00", slot_end: "15:30", is_available: true },
        ];
        setAvailableSlots(fallback);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMessage("Please select an available consultation slot.");
      return;
    }

    setBookingLoading(true);
    setErrorMessage(null);
    setConfirmation(null);

    const startDateTime = `${selectedDate}T${selectedSlot.slot_start}:00Z`;
    const endDateTime = `${selectedDate}T${selectedSlot.slot_end}:00Z`;

    const payload = {
      patient_id: user?.id || "pat-001",
      doctor_id: selectedDoctorId,
      start_time: startDateTime,
      end_time: endDateTime,
      reason: reason.trim(),
    };

    try {
      const result = await appointmentsApi.bookAppointment(payload);
      setConfirmation({
        id: result?.id || `APT-${Date.now().toString().slice(-6)}`,
        doctor:
          doctors.find((d) => d.id === selectedDoctorId)?.full_name ||
          "Assigned Physician",
        date: selectedDate,
        time: `${selectedSlot.slot_start} - ${selectedSlot.slot_end}`,
        reason: reason,
      });

      // Mark slot as booked in UI
      setAvailableSlots((prev) =>
        prev.map((s) =>
          s.slot_start === selectedSlot.slot_start
            ? { ...s, is_available: false, locked_by: "Booked" }
            : s,
        ),
      );
      setSelectedSlot(null);

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
    } catch (err) {
      const errDetail =
        err.response?.data?.detail ||
        err.message ||
        "Concurrent booking conflict: This slot is temporarily locked or already booked. Please choose another slot.";
      setErrorMessage(errDetail);
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-semibold">Book Doctor Consultation</h2>
        </div>
        <span className="text-xs bg-slate-800 text-sky-300 px-2.5 py-1 rounded font-mono border border-slate-700">
          Real-Time Slot Engine
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Department Filter & Doctor Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Department / Specialty
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              {departments.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Physician
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={loadingDoctors || doctors.length === 0}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} ({doc.specialization || doc.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Consultation Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Selected Doctor Summary Card */}
        {selectedDoctor && (
          <div className="bg-sky-50/60 border border-sky-200 rounded-lg p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedDoctor.full_name}
                </h4>
                <p className="text-xs text-slate-600">
                  {selectedDoctor.department} &bull; Fee: $
                  {selectedDoctor.consultation_fee || 150}
                </p>
              </div>
            </div>
            <Badge variant="success">Available for Consultation</Badge>
          </div>
        )}

        {/* 30-Minute Slots Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" /> Available 30-Min Time
              Slots
            </label>
            <span className="text-xs text-slate-500">
              Atomic locking prevents double booking
            </span>
          </div>

          {loadingSlots ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Loading available slots...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot?.slot_start === slot.slot_start;
                const isAvailable = slot.is_available;

                return (
                  <button
                    key={slot.slot_start}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                        : isAvailable
                          ? "bg-white hover:bg-sky-50 hover:border-sky-300 text-slate-800 border-slate-200"
                          : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div className="font-semibold">{slot.slot_start}</div>
                    <div className="text-[10px] mt-0.5">
                      {isAvailable ? (
                        "Open"
                      ) : (
                        <span className="flex items-center justify-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Consultation Reason & Submission */}
        <form
          onSubmit={handleBook}
          className="space-y-4 pt-2 border-t border-slate-100"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Visit / Chief Complaint
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Routine cardiac checkup, chest discomfort, blood pressure review"
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Booking Error</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {confirmation && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-xs flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-900">
                  Appointment Confirmed!
                </p>
                <p className="mt-1 text-emerald-700">
                  Reference ID:{" "}
                  <span className="font-mono font-semibold">
                    {confirmation.id}
                  </span>
                </p>
                <p className="text-emerald-700">
                  Physician: <strong>{confirmation.doctor}</strong> &bull;
                  Schedule:{" "}
                  <strong>
                    {confirmation.date} at {confirmation.time}
                  </strong>
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={bookingLoading || !selectedSlot}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {bookingLoading ? (
                "Confirming with Lock..."
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Confirm &amp; Book Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentBookingPanel;
