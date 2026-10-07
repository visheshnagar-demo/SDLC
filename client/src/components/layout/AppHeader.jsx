import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldCheck,
  User,
  LogOut,
  Bell,
  AlertTriangle,
  Stethoscope,
  Activity,
} from "lucide-react";
import Badge from "../common/Badge";

export const AppHeader = () => {
  const { user, logout, switchRole } = useAuth();

  return (
    <header className="bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary-600 p-2 rounded-lg text-white shadow-inner">
            <Activity className="w-5 h-5 text-sky-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              MediCare Core{" "}
              <span className="text-xs font-normal text-sky-400">
                HMS & Patient Portal
              </span>
            </h1>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          HIPAA Encrypted
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Role Switcher for Testability & RBAC Demonstration */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
          <span className="text-slate-400 font-medium">Active Role:</span>
          <select
            value={user?.role || "PATIENT"}
            onChange={(e) => switchRole(e.target.value)}
            className="bg-slate-900 text-sky-300 font-semibold rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-sky-400 cursor-pointer"
            aria-label="Select Active Role"
          >
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor / Physician</option>
            <option value="ADMIN">Hospital Admin</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
          </select>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-700">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-200">
              {user?.full_name || "John Doe"}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              {user?.email || "patient@example.com"}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sky-400 font-bold text-xs shadow-inner">
            {user?.role === "DOCTOR" ? (
              <Stethoscope className="w-4 h-4 text-sky-400" />
            ) : (
              <User className="w-4 h-4 text-sky-400" />
            )}
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
