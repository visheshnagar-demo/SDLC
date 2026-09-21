import React from "react";
import { User, Bell } from "lucide-react";

export function Header({
  title = "Poultry Farm Dashboard",
  lowStockAlerts = 0,
}) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-xs">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Farm Operations Overview &bull; {currentDate}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Low Stock Alert Badge */}
        {lowStockAlerts > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
            <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>
              {lowStockAlerts} Low Stock Alert{lowStockAlerts > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Test User Credentials Badge */}
        <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <User className="w-4 h-4 text-emerald-600" />
          <div>
            <span className="font-semibold block text-slate-800">Operator</span>
            <span className="text-[10px] text-slate-500">
              test@example.com / testpassword
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
