import React from "react";
import { Landmark, ShieldAlert } from "lucide-react";
import UserSwitcher from "./UserSwitcher.jsx";

export function Header({ activeUser, onUserChange }) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-inner text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Commercial Bank Treasury
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Maker-Checker Dual Approval Wire System
            </p>
          </div>
        </div>

        <UserSwitcher activeUser={activeUser} onUserChange={onUserChange} />
      </div>
    </header>
  );
}

export default Header;
