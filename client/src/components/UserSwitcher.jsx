import React from "react";

export default function UserSwitcher({ activeUser, onUserChange }) {
  return (
    <div className="flex items-center space-x-3">
      {activeUser === "User B" && (
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-medium">
          CHECKER MODE
        </span>
      )}
      {activeUser === "User A" && (
        <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30 font-medium">
          MAKER MODE
        </span>
      )}
      <div className="flex items-center space-x-2">
        <label
          htmlFor="user-switcher"
          className="text-xs text-slate-300 font-medium"
        >
          Active Persona:
        </label>
        <select
          id="user-switcher"
          value={activeUser}
          onChange={(e) => onUserChange(e.target.value)}
          className="bg-slate-800 text-sm text-white px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="User A">User A (Maker)</option>
          <option value="User B">User B (Checker)</option>
        </select>
      </div>
    </div>
  );
}
