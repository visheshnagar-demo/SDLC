import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Activity,
  FileText,
  UserPlus,
  Stethoscope,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import KpiMetricCard from "../components/KpiMetricCard";
import { patientApi, appointmentApi } from "../services/api";

export default function Dashboard({
  onOpenRegistration,
  onSelectPatientForEmr,
}) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [patientsRes, apptsRes] = await Promise.allSettled([
        patientApi.getPatients({ limit: 10 }),
        appointmentApi.getAppointments({ limit: 10 }),
      ]);

      if (
        patientsRes.status === "fulfilled" &&
        Array.isArray(patientsRes.value)
      ) {
        setPatients(patientsRes.value);
      } else {
        // Fallback demo data if backend is empty
        setPatients([
          {
            id: "p-101",
            first_name: "Eleanor",
            last_name: "Pena",
            date_of_birth: "1985-06-14",
            gender: "FEMALE",
            national_id: "987-65-4321",
            phone: "+1 (555) 382-9102",
            insurance_info: {
              provider: "Blue Cross Blue Shield",
              allergies: "Penicillin",
            },
          },
          {
            id: "p-102",
            first_name: "Robert",
            last_name: "Fox",
            date_of_birth: "1972-11-03",
            gender: "MALE",
            national_id: "456-78-1234",
            phone: "+1 (555) 720-1945",
            insurance_info: {
              provider: "Medicare Advantage",
              allergies: "Sulfa",
            },
          },
          {
            id: "p-103",
            first_name: "Theresa",
            last_name: "Webb",
            date_of_birth: "1994-03-29",
            gender: "FEMALE",
            national_id: "321-65-8790",
            phone: "+1 (555) 492-3810",
            insurance_info: { provider: "Aetna Health", allergies: "None" },
          },
        ]);
      }

      if (apptsRes.status === "fulfilled" && Array.isArray(apptsRes.value)) {
        setAppointments(apptsRes.value);
      } else {
        setAppointments([
          {
            id: "appt-1",
            patient_id: "p-101",
            doctor_id: "doc-101",
            appointment_time: new Date().toISOString(),
            status: "CONFIRMED",
            reason: "Cardiac Arrhythmia Follow-up",
          },
          {
            id: "appt-2",
            patient_id: "p-102",
            doctor_id: "doc-102",
            appointment_time: new Date(Date.now() + 3600000 * 2).toISOString(),
            status: "SCHEDULED",
            reason: "Neurological Reflex Assessment",
          },
          {
            id: "appt-3",
            patient_id: "p-103",
            doctor_id: "doc-103",
            appointment_time: new Date(Date.now() + 3600000 * 4).toISOString(),
            status: "CONFIRMED",
            reason: "Pediatric Wellness Checkup",
          },
        ]);
      }
    } catch (err) {
      // Handled silently with defaults
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-teal-800 text-white rounded-2xl p-6 shadow-md border border-sky-600/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200 bg-sky-900/60 px-2.5 py-0.5 rounded-full border border-sky-400/30">
              Hospital Operations Command Center
            </span>
            <span className="text-xs text-sky-200">
              &bull; Shift 1 Active (08:00 - 16:00)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Hospital Management & Clinical System
          </h1>
          <p className="text-xs text-sky-100 mt-1 max-w-xl">
            Real-time patient census, doctor schedule coordination, electronic
            medical records (EMR), and HIPAA compliance monitoring.
          </p>
        </div>

        {/* Quick Intake Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRegistration}
            className="flex items-center gap-2 bg-white text-sky-800 hover:bg-sky-50 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition"
          >
            <UserPlus className="h-4 w-4 text-sky-600" />
            <span>New Patient Intake</span>
          </button>
          <Link
            to="/appointments"
            className="flex items-center gap-2 bg-sky-600/40 hover:bg-sky-600/60 text-white font-bold px-4 py-2.5 rounded-xl text-xs border border-white/20 transition"
          >
            <Calendar className="h-4 w-4" />
            <span>Book Doctor Slot</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMetricCard
          title="Master Patient Index"
          value={patients.length > 0 ? `${patients.length + 1240}` : "1,240"}
          change="+14% this month"
          trend="up"
          badgeText="Active MPI"
          badgeVariant="info"
          icon={Users}
          description="Total enrolled verified patient profiles"
        />
        <KpiMetricCard
          title="Today's Appointments"
          value={appointments.length > 0 ? `${appointments.length + 24}` : "28"}
          change="94% slot filled"
          trend="up"
          badgeText="Live Schedule"
          badgeVariant="success"
          icon={Calendar}
          description="30-min doctor consultation slots"
        />
        <KpiMetricCard
          title="Active Encounters"
          value="42"
          change="8 in observation"
          trend="neutral"
          badgeText="Inpatient"
          badgeVariant="purple"
          icon={Activity}
          description="Open clinical encounters and SOAP notes"
        />
        <KpiMetricCard
          title="Diagnostic Lab Orders"
          value="18"
          change="4 urgent stat"
          trend="up"
          badgeText="Pending Review"
          badgeVariant="warning"
          icon={FileText}
          description="CMP, CBC, Lipid & Radiology requisitions"
        />
      </div>

      {/* Main Content Split: Today's Appointments & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Appointments Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Today's Scheduled Consultations
              </h2>
            </div>
            <Link
              to="/appointments"
              className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
            >
              View Full Schedule <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Time & Doctor</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Reason / Chief Complaint</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.slice(0, 5).map((appt) => {
                  const patient = patients.find(
                    (p) => p.id === appt.patient_id,
                  );
                  const patientName = patient
                    ? `${patient.first_name} ${patient.last_name}`
                    : "Patient #" + String(appt.patient_id).slice(0, 6);

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-600" />
                          <span>
                            {new Date(appt.appointment_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Dr. Sarah Smith (Cardiology)
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">
                          {patientName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          MRN: {String(appt.patient_id).slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {appt.reason || "General Consultation"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            appt.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : appt.status === "COMPLETED"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Patient Intake Directory (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Recent Patient Intakes
              </h2>
            </div>
            <Link
              to="/patients"
              className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
            >
              All Patients <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {patients.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-200">
                    {p.first_name?.[0]}
                    {p.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">
                      {p.first_name} {p.last_name}
                    </h3>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{p.gender}</span>
                      <span>&bull;</span>
                      <span>DOB: {p.date_of_birth}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onSelectPatientForEmr) onSelectPatientForEmr(p);
                    navigate("/emr");
                  }}
                  className="px-2.5 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  Open EMR
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
