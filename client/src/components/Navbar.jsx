import React from "react";
import { Bell, Calendar, User } from "lucide-react";

const Navbar = ({
  title = "Operations Dashboard",
  subtitle = "Real-time property management and front-desk control",
}) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>{currentDate}</span>
        </div>

        {/* Notifications Mock */}
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600"></span>
        </button>

        {/* Staff User Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs border border-blue-200">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800">
              Front Desk Staff
            </div>
            <div className="text-[11px] text-slate-500">Receptionist Desk</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
