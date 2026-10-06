import React from "react";
import PropTypes from "prop-types";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Users,
  Calendar,
  FileText,
  CreditCard,
  PlusCircle,
  HeartPulse,
} from "lucide-react";

export const Sidebar = () => {
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Activity },
    { name: "Patients", path: "/patients", icon: Users },
    { name: "Appointments", path: "/appointments", icon: Calendar },
    { name: "EHR Encounters", path: "/ehr", icon: FileText },
    { name: "Billing", path: "/billing", icon: CreditCard },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 min-h-screen shrink-0">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              CarePulse
            </h2>
            <span className="text-[11px] font-medium text-teal-600 tracking-wider uppercase">
              HMS Portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Quick Action CTA */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <button
          onClick={() => navigate("/patients")}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Patient Intake</span>
        </button>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            HIPAA Compliant v2.4
          </p>
          <span className="inline-block mt-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
            System Online
          </span>
        </div>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {};

export default Sidebar;
