import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import KPICard from "../components/common/KPICard";
import AppointmentBookingPanel from "../components/patient/AppointmentBookingPanel";
import VisitHistoryTable from "../components/patient/VisitHistoryTable";
import PatientRegistrationModal from "../components/patient/PatientRegistrationModal";
import {
  Calendar,
  Pill,
  FileText,
  ShieldCheck,
  UserPlus,
  HeartPulse,
  Activity,
  Download,
} from "lucide-react";

export const PatientDashboardPage = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Patient Care Portal
            </span>
            <span className="text-xs text-sky-300 font-mono">
              MRN: {user?.id || "PAT-001"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.full_name || "John Doe"}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage your medical appointments, clinical encounter summaries,
            e-prescriptions, and diagnostic lab reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Update Demographics / Intake
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Next Appointment"
          value="Oct 15, 09:30 AM"
          subtitle="Dr. Sarah Smith (Cardiology)"
          icon={Calendar}
          color="sky"
        />
        <KPICard
          title="Active Prescriptions"
          value="2 Medications"
          subtitle="Lisinopril 10mg, Acetaminophen"
          icon={Pill}
          color="emerald"
        />
        <KPICard
          title="Lab Test Reports"
          value="3 Completed"
          subtitle="All vitals & lipid panels normal"
          icon={FileText}
          color="indigo"
        />
        <KPICard
          title="HIPAA Data Vault"
          value="Encrypted"
          subtitle="End-to-end PHI security verified"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      {/* Main Grid: Booking Panel & Consultation History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <AppointmentBookingPanel
            onBookingSuccess={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <VisitHistoryTable refreshTrigger={refreshTrigger} />
        </div>
      </div>

      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientCreated={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};

export default PatientDashboardPage;
