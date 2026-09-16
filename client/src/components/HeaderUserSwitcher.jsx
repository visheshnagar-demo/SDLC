import React from "react";
import { Building2, UserCheck, ShieldAlert, ChevronDown } from "lucide-react";

const USERS = [
  {
    id: "User A (Maker)",
    name: "User A",
    role: "Maker",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "User B (Checker)",
    name: "User B",
    role: "Checker",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
];

export default function HeaderUserSwitcher({ currentUser, onUserChange }) {
  const activeUser = USERS.find((u) => u.id === currentUser) || USERS[0];

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Commercial Bank
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Wire Operations
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Maker-Checker Dual Approval Portal
            </p>
          </div>
        </div>

        {/* User Switcher Control */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-xs text-slate-400">Active User Context</span>
            <span className="text-xs font-medium text-slate-200">
              {activeUser.name}
            </span>
          </div>

          <div className="relative inline-block">
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <label htmlFor="user-switcher-select" className="sr-only">
                Select Active User
              </label>
              <select
                id="user-switcher-select"
                aria-label="User Switcher"
                value={currentUser}
                onChange={(e) => onUserChange(e.target.value)}
                className="bg-slate-800 text-slate-100 text-sm font-medium rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8 appearance-none"
              >
                {USERS.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                    className="bg-slate-800 text-slate-100"
                  >
                    {user.id}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 flex items-center text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Role Badge */}
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${activeUser.color}`}
          >
            {activeUser.role}
          </span>
        </div>
      </div>
    </header>
  );
}
