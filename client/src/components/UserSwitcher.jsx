import React from "react";

export default function UserSwitcher({ activeUser, onUserChange }) {
  const isCheckerMode =
    activeUser.includes("Checker") || activeUser.includes("User B");

  return (
    <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl" role="img" aria-label="bank">
            🏦
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Apex Commercial Bank
          </h1>
        </div>
        {isCheckerMode ? (
          <span className="text-xs bg-amber-900 text-amber-200 px-2.5 py-1 rounded font-semibold border border-amber-700">
            CHECKER MODE
          </span>
        ) : (
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded font-mono">
            Production | Fedwire Live
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <label
          htmlFor="user-switcher"
          className="text-xs text-slate-400 font-medium"
        >
          Active Role:
        </label>
        <select
          id="user-switcher"
          aria-label="Active Role"
          value={activeUser}
          onChange={(e) => onUserChange(e.target.value)}
          className="bg-slate-800 text-white text-sm font-semibold px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="User A (Maker)">User A (Maker)</option>
          <option value="User B (Checker)">User B (Checker)</option>
        </select>
      </div>
    </header>
  );
}
