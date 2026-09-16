import React from "react";
import { UserCheck, Shield } from "lucide-react";

export function UserSwitcher({ activeUser, onUserChange }) {
  const users = [
    {
      id: "User A",
      name: "User A (Maker)",
      role: "Maker",
      desc: "Can initiate wire transfers",
    },
    {
      id: "User B",
      name: "User B (Checker)",
      role: "Checker",
      desc: "Can approve/reject pending transfers",
    },
  ];

  return (
    <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
        <Shield className="w-3.5 h-3.5 text-blue-400" />
        <span>Active Session:</span>
      </div>
      <select
        value={activeUser}
        onChange={(e) => onUserChange(e.target.value)}
        className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        aria-label="Select User Role"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <div className="hidden sm:flex items-center text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
        <UserCheck className="w-3 h-3 mr-1" />
        {activeUser === "User A" ? "MAKER ROLE" : "CHECKER ROLE"}
      </div>
    </div>
  );
}

export default UserSwitcher;
