import React from "react";
import { User, ShieldCheck, UserCheck } from "lucide-react";

const USERS = [
  {
    id: "User A",
    name: "User A (Maker)",
    role: "Maker",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    id: "User B",
    name: "User B (Checker)",
    role: "Checker",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
];

export default function UserSwitcher({ currentUser, onUserChange }) {
  const activeUser = USERS.find((u) => u.id === currentUser) || USERS[0];

  return (
    <div className="flex items-center gap-3 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-xs border border-slate-600">
          {activeUser.id.replace("User ", "")}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-slate-400 font-medium leading-none">
            Active Persona
          </p>
          <p className="text-sm font-semibold text-slate-100 leading-tight mt-0.5">
            {activeUser.name}
          </p>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

      <div className="relative">
        <label htmlFor="user-persona-select" className="sr-only">
          Switch User Persona
        </label>
        <select
          id="user-persona-select"
          value={currentUser}
          onChange={(e) => onUserChange(e.target.value)}
          aria-label="Switch User Persona"
          className="bg-slate-900 text-slate-200 text-xs font-medium rounded-md px-3 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          {USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </div>

      <span
        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${activeUser.color}`}
      >
        {activeUser.role}
      </span>
    </div>
  );
}
