import React, { useState } from "react";
import PropTypes from "prop-types";
import { Search, Bell, User, Shield } from "lucide-react";

export const Header = ({
  title = "CarePulse HMS Overview",
  searchTerm = "",
  onSearchChange = () => {},
  currentRole = "Doctor",
  onRoleChange = () => {},
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: "n1", text: "New appointment scheduled: Jane Doe", time: "10m ago" },
    { id: "n2", text: "Lab result ready for CMP panel", time: "25m ago" },
    { id: "n3", text: "Invoice #INV-5001 marked as paid", time: "1h ago" },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search MRN, patient name... (Ctrl+K)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <Shield className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value)}
            aria-label="Role Switcher"
            className="bg-transparent font-medium text-slate-700 focus:outline-none pr-1 cursor-pointer"
          >
            <option value="Doctor">Dr. Sarah Jenkins (Doctor)</option>
            <option value="Admin">Admin Staff (Registrar)</option>
            <option value="Patient">Jane Doe (Patient)</option>
          </select>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-30">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Notifications
                </span>
                <span className="text-[10px] text-teal-600 font-semibold cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 hover:bg-slate-50 rounded-lg text-xs text-slate-600"
                  >
                    <p className="font-medium text-slate-800">{n.text}</p>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {currentRole === "Doctor"
                ? "Dr. Sarah Jenkins"
                : currentRole === "Admin"
                  ? "Admin Registrar"
                  : "Jane Doe"}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              {currentRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  currentRole: PropTypes.string,
  onRoleChange: PropTypes.func,
};

export default Header;
