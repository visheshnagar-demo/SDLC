import React, { useState } from "react";
import AppointmentBookingPanel from "../components/patient/AppointmentBookingPanel";
import VisitHistoryTable from "../components/patient/VisitHistoryTable";
import {
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle,
  Shield,
} from "lucide-react";

export const AppointmentsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-xl shadow-inner text-white">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                Appointment Scheduling &amp; Provider Registry
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Real-Time Provider Directory
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Search doctors by specialty, check live 30-minute availability,
              and manage consultation bookings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <AppointmentBookingPanel
            onBookingSuccess={() => setRefreshKey((k) => k + 1)}
          />
        </div>
        <div className="lg:col-span-6">
          <VisitHistoryTable refreshTrigger={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
