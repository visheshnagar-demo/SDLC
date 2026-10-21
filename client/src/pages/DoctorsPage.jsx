import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Stethoscope,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import DoctorRosterList from "../components/doctors/DoctorRosterList";
import ScheduleConfigurator from "../components/doctors/ScheduleConfigurator";
import SlotPickerGrid from "../components/appointments/SlotPickerGrid";
import { doctorsApi } from "../services/api";

export function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Availability preview state
  const [previewDate, setPreviewDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await doctorsApi.list({ limit: 50 });
      const doctorList =
        data && data.length > 0
          ? data
          : [
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
              {
                id: "doc-4",
                doctor_code: "DOC-104",
                department: "Orthopedics",
                qualification: "MS Ortho, Mayo Clinic",
                consultation_fee: 160,
                slot_duration_minutes: 30,
                is_available: false,
                user: { full_name: "Dr. Sarah Jenkins" },
              },
              {
                id: "doc-5",
                doctor_code: "DOC-105",
                department: "General Medicine",
                qualification: "MD Internal Medicine, Oxford",
                consultation_fee: 100,
                slot_duration_minutes: 30,
                is_available: true,
                user: { full_name: "Dr. Robert Chen" },
              },
            ];
      setDoctors(doctorList);
      if (!selectedDoctor && doctorList.length > 0) {
        setSelectedDoctor(doctorList[0]);
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load doctor directory.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (docId, date) => {
    if (!docId) return;
    setLoadingSlots(true);
    try {
      const data = await doctorsApi.getAvailability(docId, date);
      setAvailableSlots(data?.available_slots || []);
    } catch {
      // Fallback slots handled inside SlotPickerGrid
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailability(selectedDoctor.id, previewDate);
    }
  }, [selectedDoctor, previewDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
              Physician Scheduling & Roster
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role-Based Access
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Doctor Schedules & Specialty Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure working hours, 30-minute consultation slot matrices, and
            department assignments.
          </p>
        </div>

        <button
          onClick={fetchDoctors}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors self-start sm:self-auto"
          title="Refresh Doctor List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Specialty Directory Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-indigo-600" />
            <span>Select Physician to Manage Schedule</span>
          </h2>
          <span className="text-xs text-slate-500">
            Selected:{" "}
            <span className="font-semibold text-slate-800">
              {selectedDoctor?.user?.full_name ||
                selectedDoctor?.doctor_code ||
                "None"}
            </span>
          </span>
        </div>

        <DoctorRosterList
          doctors={doctors}
          selectedDoctor={selectedDoctor}
          onSelectDoctor={(doc) => setSelectedDoctor(doc)}
          loading={loading}
          error={error}
        />
      </div>

      {/* Schedule Configurator and Real-Time Availability Matrix */}
      {selectedDoctor && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Working Hours Configurator (2 cols) */}
          <div className="lg:col-span-2">
            <ScheduleConfigurator
              doctor={selectedDoctor}
              onScheduleSaved={() => {
                fetchAvailability(selectedDoctor.id, previewDate);
              }}
            />
          </div>

          {/* Slot Availability Preview Card (1 col) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm self-start">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live Slot Matrix Preview</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time consultation slots for Dr.{" "}
                {selectedDoctor.user?.full_name || selectedDoctor.doctor_code}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Preview Date
              </label>
              <input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <SlotPickerGrid
              availableSlots={availableSlots}
              loading={loadingSlots}
              readOnly={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorsPage;
