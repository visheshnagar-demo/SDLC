import React from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  Users,
  UserPlus,
  Grid,
  UserCheck,
  FileText,
} from "lucide-react";

export function Navbar({ currentRole, onRoleChange }) {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 font-sans sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Facility Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg rounded-sm border border-cyan-500/40">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white font-mono flex items-center gap-2">
                APEX STATE CORRECTIONAL COMPLEX
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                SECTOR 4 HIGH-SECURITY FACILITY • DEFCON: NOMINAL
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <Users className="w-4 h-4" />
              Inmate Roster
            </NavLink>

            <NavLink
              to="/intake"
              className={({ isActive }) =>
                `px-3 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <UserPlus className="w-4 h-4" />
              New Intake
            </NavLink>

            <NavLink
              to="/housing"
              className={({ isActive }) =>
                `px-3 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <Grid className="w-4 h-4" />
              Housing Matrix
            </NavLink>

            <NavLink
              to="/visitors"
              className={({ isActive }) =>
                `px-3 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <UserCheck className="w-4 h-4" />
              Visitor Screening
            </NavLink>

            <NavLink
              to="/audit"
              className={({ isActive }) =>
                `px-3 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <FileText className="w-4 h-4" />
              Audit Logs
            </NavLink>
          </nav>

          {/* User Badge & RBAC Role Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded border border-cyan-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              CAPT. M. BRIGGS ({currentRole || "ADMIN"})
            </span>
            {onRoleChange && (
              <select
                value={currentRole || "ADMIN"}
                onChange={(e) => onRoleChange(e.target.value)}
                className="bg-slate-900 text-xs font-mono text-slate-300 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                aria-label="Role Selector"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="GUARD">GUARD</option>
                <option value="MEDICAL">MEDICAL</option>
              </select>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
