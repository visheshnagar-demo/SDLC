import React, { useState, useEffect } from "react";
import {
  Search,
  Building2,
  Clock,
  User,
  LogOut,
  Bell,
  ShieldCheck,
} from "lucide-react";

export default function HeaderBar({ user, onLogout, onGlobalSearch }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacility, setSelectedFacility] = useState(
    "Central General Hospital - Main Campus",
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch) {
      onGlobalSearch(searchTerm);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "DOCTOR":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "NURSE":
        return "bg-teal-100 text-teal-800 border-teal-300";
      case "PATIENT":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Facility Switcher & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div className="hidden md:flex items-center gap-2 text-slate-700 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200">
          <Building2 className="h-4 w-4 text-sky-600 shrink-0" />
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Central General Hospital - Main Campus">
              Main Campus (Wing A/B)
            </option>
            <option value="Cardiology & Critical Care Center">
              Cardiology Pavilion
            </option>
            <option value="Pediatrics & Family Outpatient Center">
              Outpatient Center
            </option>
          </select>
        </div>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient by Name, MRN, SSN, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-slate-200 px-1.5 py-0.5 rounded">
              Ctrl+K
            </span>
          </div>
        </form>
      </div>

      {/* Right Controls: Shift Timer, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Live Shift Clock */}
        <div className="hidden lg:flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200">
          <Clock className="h-3.5 w-3.5 text-teal-600" />
          <span>
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 text-[11px] font-medium">
            UTC Sync
          </span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="System Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.username ? (
                user.username.charAt(0).toUpperCase()
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.username || user?.email || "Medical Staff"}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                    user?.role || "ADMIN",
                  )}`}
                >
                  {user?.role || "STAFF"}
                </span>
                <span className="flex items-center text-[10px] text-emerald-600 font-medium">
                  <ShieldCheck className="h-3 w-3 inline mr-0.5" /> HIPAA
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
