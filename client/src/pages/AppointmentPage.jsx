import React from "react";
import AppointmentScheduler from "../components/appointment/AppointmentScheduler.jsx";

export const AppointmentPage = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Dashboard &gt; Appointments &gt; Calendar &amp; Slots
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Doctor Appointment Scheduling &amp; Slot Booking
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Search provider availability, reserve 30-minute consultation slots,
          and manage clinic calendar queues.
        </p>
      </div>

      <AppointmentScheduler />
    </div>
  );
};

export default AppointmentPage;
