import React from "react";
import { Building2, ShieldCheck, UserCheck } from "lucide-react";

export const HeaderNavbar = ({ currentUser, onUserChange }) => {
  return (
    <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between shadow-md gap-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight">
              Global Commercial Bank
            </h1>
            <span className="bg-slate-800 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> SOX Dual Control
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Commercial Wire Management Portal
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <UserCheck className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-300 font-medium">
            Current Persona:
          </span>
          <select
            value={currentUser}
            onChange={(e) => onUserChange(e.target.value)}
            className="bg-slate-900 text-white text-sm font-semibold rounded px-2.5 py-1 border border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
            aria-label="User Switcher"
          >
            <option value="User A (Maker)">User A (Maker)</option>
            <option value="User B (Checker)">User B (Checker)</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default HeaderNavbar;
