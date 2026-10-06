import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Activity,
  CreditCard,
  UserPlus,
  PlusCircle,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import StatCard from "../components/common/StatCard.jsx";
import Badge from "../components/common/Badge.jsx";

export const DashboardPage = () => {
  const navigate = useNavigate();

  const [appointments] = useState([
    {
      id: "apt-1",
      patient: "Jane Doe",
      mrn: "MRN-99201",
      doctor: "Dr. Sarah Jenkins",
      department: "Cardiology",
      time: "10:00 AM",
      type: "Consultation",
      status: "Scheduled",
      variant: "info",
    },
    {
      id: "apt-2",
      patient: "Marcus Vance",
      mrn: "MRN-84920",
      doctor: "Dr. Sarah Jenkins",
      department: "Cardiology",
      time: "09:00 AM",
      type: "Routine Followup",
      status: "Completed",
      variant: "success",
    },
    {
      id: "apt-3",
      patient: "Elena Rostova",
      mrn: "MRN-77102",
      doctor: "Dr. Robert Chen",
      department: "Neurology",
      time: "09:30 AM",
      type: "Diagnostic Triage",
      status: "In Progress",
      variant: "warning",
    },
    {
      id: "apt-4",
      patient: "David Kim",
      mrn: "MRN-65403",
      doctor: "Dr. Lisa Patel",
      department: "General Medicine",
      time: "11:30 AM",
      type: "Annual Wellness",
      status: "Scheduled",
      variant: "info",
    },
  ]);

  const [activityFeed] = useState([
    {
      id: "act-1",
      text: "Dr. Jenkins finalized encounter notes for Jane Doe",
      time: "12m ago",
    },
    {
      id: "act-2",
      text: "Payment received: $170.00 for Invoice #INV-5001",
      time: "40m ago",
    },
    {
      id: "act-3",
      text: "Marcus Vance checked in at Outpatient Reception",
      time: "1h ago",
    },
    {
      id: "act-4",
      text: "New patient intake completed for Elena Rostova",
      time: "2h ago",
    },
  ]);

  return (
    <div className="space-y-8">
      {/* KPI Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Patients"
          value="1,248"
          change="+5.2%"
          icon={Users}
        />
        <StatCard
          label="Today's Appointments"
          value="38"
          subtext="12 pending"
          icon={Calendar}
        />
        <StatCard
          label="Active Encounters"
          value="14"
          status="In Progress"
          icon={Activity}
        />
        <StatCard
          label="Pending Invoices"
          value="$18,450"
          subtext="9 claims in queue"
          icon={CreditCard}
        />
      </div>

      {/* Main Grid: Today's Appointments Table + Quick Actions/Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Today's Appointment Queue
              </h2>
              <p className="text-xs text-slate-500">
                Live clinical roster for June 10, 2026
              </p>
            </div>
            <button
              onClick={() => navigate("/appointments")}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        {apt.patient}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {apt.mrn}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {apt.time}
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{apt.doctor}</div>
                      <div className="text-[10px] text-slate-400">
                        {apt.department}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{apt.type}</td>
                    <td className="p-3">
                      <Badge variant={apt.variant}>{apt.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      {apt.status === "Scheduled" && (
                        <button
                          onClick={() => navigate("/ehr")}
                          className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold rounded text-[11px] transition-colors"
                        >
                          Start EHR
                        </button>
                      )}
                      {apt.status === "In Progress" && (
                        <button
                          onClick={() => navigate("/ehr")}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold rounded text-[11px] transition-colors"
                        >
                          Resume
                        </button>
                      )}
                      {apt.status === "Completed" && (
                        <button
                          onClick={() => navigate("/billing")}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded text-[11px] transition-colors"
                        >
                          Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Activity Feed */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate("/patients")}
                className="p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 rounded-lg text-left transition-all group"
              >
                <UserPlus className="w-4 h-4 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-800">New Patient</p>
                <p className="text-[10px] text-slate-400">Intake & MRN</p>
              </button>

              <button
                onClick={() => navigate("/appointments")}
                className="p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 rounded-lg text-left transition-all group"
              >
                <PlusCircle className="w-4 h-4 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-800">Book Slot</p>
                <p className="text-[10px] text-slate-400">Calendar schedule</p>
              </button>

              <button
                onClick={() => navigate("/ehr")}
                className="p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 rounded-lg text-left transition-all group"
              >
                <Activity className="w-4 h-4 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-800">
                  EHR Encounter
                </p>
                <p className="text-[10px] text-slate-400">Clinical notes</p>
              </button>

              <button
                onClick={() => navigate("/billing")}
                className="p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 rounded-lg text-left transition-all group"
              >
                <FileText className="w-4 h-4 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-800">
                  Billing Portal
                </p>
                <p className="text-[10px] text-slate-400">Claims & payment</p>
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Clinical Activity Feed
            </h3>
            <div className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item.id} className="flex gap-2.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700 font-medium">{item.text}</p>
                    <span className="text-[10px] text-slate-400">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
